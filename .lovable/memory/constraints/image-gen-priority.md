---
name: Image generation priority
description: Use Hugging Face (HF_TOKEN) first for image gen, Gemini Nano as fallback. Never use other paid APIs.
type: constraint
---
1. **Hugging Face (priority):** Always try HF_TOKEN + stabilityai/stable-diffusion-xl-base-1.0 first.
2. **Fallback:** If HF unavailable or fails, use Gemini (google/gemini-2.5-flash-image) via Lovable AI Gateway.
3. **Never** use other paid image APIs or ask user for additional keys.
4. Always log which service was used for image generation.
