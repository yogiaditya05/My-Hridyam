import { z } from "zod";
import { router, protectedProcedure } from "../config/trpc";
import { createMessage, getUserMessages, updateUserContext } from "../db/queries";
import { invokeLLM } from "../ai/llm";
import { getSystemPrompt } from "../prompts/systemPrompt";
import { transcribeAudio } from "../voice/voiceService";
import { TRPCError } from "@trpc/server";

// Simple rule-based emotional classification
function analyzeEmotion(text: string): string {
  const lowercase = text.toLowerCase();
  
  const sadness = ["sad", "depressed", "cry", "hurt", "grief", "broken", "pain", "unhappy", "hopeless"];
  const anxiety = ["anxious", "worry", "scared", "fear", "panic", "stress", "nervous", "tense", "frightened"];
  const anger = ["angry", "mad", "hate", "furious", "annoyed", "pissed", "irritated"];
  const joy = ["happy", "excited", "good", "great", "glad", "joy", "peace", "cheerful", "grateful"];
  const loneliness = ["lonely", "alone", "isolated", "no one", "empty", "abandoned"];

  if (sadness.some(word => lowercase.includes(word))) return "sadness";
  if (anxiety.some(word => lowercase.includes(word))) return "anxiety";
  if (anger.some(word => lowercase.includes(word))) return "anger";
  if (joy.some(word => lowercase.includes(word))) return "happiness";
  if (loneliness.some(word => lowercase.includes(word))) return "loneliness";
  return "neutral";
}

export const chatRouter = router({
  send: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const userMessage = input.message.trim();

      // Crisis detection keywords
      const crisisKeywords = [
        "suicide",
        "kill myself",
        "want to die",
        "marna hai",
        "self harm",
        "hurt myself",
        "end it all",
        "no point living",
        "cut myself",
      ];
      
      const isCrisis = crisisKeywords.some((keyword) =>
        userMessage.toLowerCase().includes(keyword)
      );

      // Rule-based sentiment analysis
      const emotion = analyzeEmotion(userMessage);

      // 1. Save user message to database with detected emotion
      await createMessage(userId, "user", userMessage, isCrisis, emotion);

      // Return crisis response immediately to keep user safe
      if (isCrisis) {
        const crisisResponse =
          "I hear how much pain you're in, and I want you to be safe. Please connect with someone who can support you right now. You can call or text a crisis helpline (like 988 in the US/Canada or your local emergency service) to speak with a professional. You don't have to carry this alone.";
        await createMessage(userId, "assistant", crisisResponse, true, "crisis");
        return { reply: crisisResponse, isCrisis: true };
      }

      // 2. Fetch conversation history (increased to last 15 messages for better memory context)
      const history = await getUserMessages(userId, 15);

      // 3. Update persistent memory context based on recent emotion trends
      // If user frequently displays sadness or anxiety, we log it in their user profile context
      const recentEmotions = history
        .map(msg => msg.emotion)
        .filter((e): e is string => !!e);
        
      if (recentEmotions.length >= 5) {
        const counts = recentEmotions.reduce((acc, curr) => {
          acc[curr] = (acc[curr] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        let dominantEmotion = "neutral";
        let maxCount = 0;
        for (const [emo, count] of Object.entries(counts)) {
          if (count > maxCount && emo !== "neutral") {
            dominantEmotion = emo;
            maxCount = count;
          }
        }
        
        if (maxCount >= 3) {
          const profileSummary = `User frequently shows signs of ${dominantEmotion} in recent exchanges. Stay extra supportive and check in gently.`;
          await updateUserContext(userId, profileSummary);
          ctx.user.userContext = profileSummary; // update runtime context
        }
      }

      // 4. Generate personalized system prompt
      const systemPrompt = getSystemPrompt(ctx.user.name, ctx.user.userContext);

      // 5. Construct chat history payload for LLM invocation
      const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...history.map((msg) => ({
          role: (msg.role === "user" ? "user" : "assistant") as "user" | "assistant",
          content: msg.content,
        })),
      ];

      // If the last message in history is the user message we just created,
      // it is already in the list. Ensure we don't duplicate it.
      if (history.length === 0 || history[history.length - 1].content !== userMessage) {
        llmMessages.push({ role: "user", content: userMessage });
      }

      try {
        const response = await invokeLLM({
          messages: llmMessages,
        });

        const replyContent = response.choices[0]?.message?.content;
        const reply = typeof replyContent === "string" ? replyContent : "I am here with you. What is on your mind?";
        
        // Save assistant reply to database
        const assistantEmotion = analyzeEmotion(reply);
        await createMessage(userId, "assistant", reply, false, assistantEmotion);

        return { reply, isCrisis: false };
      } catch (error) {
        console.error("[LLM Route] Error invoking LLM:", error);
        
        const fallbackReply = "I'm listening. Tell me more about what you're experiencing.";
        await createMessage(userId, "assistant", fallbackReply, false, "neutral");
        
        return { reply: fallbackReply, isCrisis: false };
      }
    }),

  // Returns historical messages for the authenticated user
  history: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    return await getUserMessages(userId, 50);
  }),

  // Transcribes audio files (via URL or base64) to text using Whisper/Gemini
  transcribe: protectedProcedure
    .input(
      z.object({
        audioUrl: z.string().optional(),
        audioBase64: z.string().optional(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          audioBase64: input.audioBase64,
          mimeType: input.mimeType,
        });
        
        if ("error" in result) {
          console.error("[Transcription Route] Whisper API failed:", result);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${result.error}: ${result.details || "No details provided"}`,
          });
        }
        
        return { text: result.text };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("[Transcription Route] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to transcribe voice clip",
        });
      }
    }),
});
