export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_cost_snapshot: {
        Row: {
          conversion_rate_free_to_paid: number | null
          created_at: string
          id: string
          snapshot_date: string
          tokens_input_total: number | null
          tokens_output_total: number | null
          total_api_cost: number | null
          total_margin: number | null
          total_mrr: number | null
          users_church: number | null
          users_free: number | null
          users_ministry: number | null
          users_pastoral: number | null
        }
        Insert: {
          conversion_rate_free_to_paid?: number | null
          created_at?: string
          id?: string
          snapshot_date: string
          tokens_input_total?: number | null
          tokens_output_total?: number | null
          total_api_cost?: number | null
          total_margin?: number | null
          total_mrr?: number | null
          users_church?: number | null
          users_free?: number | null
          users_ministry?: number | null
          users_pastoral?: number | null
        }
        Update: {
          conversion_rate_free_to_paid?: number | null
          created_at?: string
          id?: string
          snapshot_date?: string
          tokens_input_total?: number | null
          tokens_output_total?: number | null
          total_api_cost?: number | null
          total_margin?: number | null
          total_mrr?: number | null
          users_church?: number | null
          users_free?: number | null
          users_ministry?: number | null
          users_pastoral?: number | null
        }
        Relationships: []
      }
      bible_commentary_embeddings: {
        Row: {
          book: string
          chapter: number
          commentary_text: string
          created_at: string
          embedding: string | null
          id: string
          language: string
          source: string
          verse_end: number | null
          verse_start: number
        }
        Insert: {
          book: string
          chapter: number
          commentary_text: string
          created_at?: string
          embedding?: string | null
          id?: string
          language?: string
          source: string
          verse_end?: number | null
          verse_start: number
        }
        Update: {
          book?: string
          chapter?: number
          commentary_text?: string
          created_at?: string
          embedding?: string | null
          id?: string
          language?: string
          source?: string
          verse_end?: number | null
          verse_start?: number
        }
        Relationships: []
      }
      bible_streaks: {
        Row: {
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bible_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_texts: {
        Row: {
          book: string
          chapter: number
          id: string
          text: string
          translation: string
          verse: number
        }
        Insert: {
          book: string
          chapter: number
          id?: string
          text: string
          translation: string
          verse: number
        }
        Update: {
          book?: string
          chapter?: number
          id?: string
          text?: string
          translation?: string
          verse?: number
        }
        Relationships: []
      }
      content_library: {
        Row: {
          author: string | null
          category: string
          created_at: string
          id: string
          license_type: string
          source_file: string | null
          title: string
          total_items: number | null
        }
        Insert: {
          author?: string | null
          category: string
          created_at?: string
          id?: string
          license_type?: string
          source_file?: string | null
          title: string
          total_items?: number | null
        }
        Update: {
          author?: string | null
          category?: string
          created_at?: string
          id?: string
          license_type?: string
          source_file?: string | null
          title?: string
          total_items?: number | null
        }
        Relationships: []
      }
      content_sections: {
        Row: {
          book: string | null
          category: string
          created_at: string
          historical_context: string | null
          id: string
          library_id: string | null
          metadata: Json | null
          practical_application: string | null
          reference: string | null
          reflection_questions: Json | null
          search_vector: unknown
          summary: string | null
          testament: string | null
          theological_message: string | null
          title: string
        }
        Insert: {
          book?: string | null
          category: string
          created_at?: string
          historical_context?: string | null
          id?: string
          library_id?: string | null
          metadata?: Json | null
          practical_application?: string | null
          reference?: string | null
          reflection_questions?: Json | null
          search_vector?: unknown
          summary?: string | null
          testament?: string | null
          theological_message?: string | null
          title: string
        }
        Update: {
          book?: string | null
          category?: string
          created_at?: string
          historical_context?: string | null
          id?: string
          library_id?: string | null
          metadata?: Json | null
          practical_application?: string | null
          reference?: string | null
          reflection_questions?: Json | null
          search_vector?: unknown
          summary?: string | null
          testament?: string | null
          theological_message?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sections_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "content_library"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          plan_from: string | null
          plan_to: string | null
          trigger_name: string | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          plan_from?: string | null
          plan_to?: string | null
          trigger_name?: string | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          plan_from?: string | null
          plan_to?: string | null
          trigger_name?: string | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      devotionals: {
        Row: {
          anchor_verse: string
          anchor_verse_text: string
          audio_duration_seconds: number | null
          audio_url: string | null
          audio_url_alloy: string | null
          audio_url_nova: string | null
          audio_url_onyx: string | null
          body_text: string
          category: string
          closing_prayer: string | null
          cover_image_url: string | null
          created_at: string | null
          daily_practice: string | null
          id: string
          is_published: boolean | null
          language: string | null
          reflection_question: string | null
          scheduled_date: string
          supplementary_reading: string | null
          title: string
          today_action: string | null
          tts_generated_at: string | null
          tts_voice: string | null
        }
        Insert: {
          anchor_verse: string
          anchor_verse_text: string
          audio_duration_seconds?: number | null
          audio_url?: string | null
          audio_url_alloy?: string | null
          audio_url_nova?: string | null
          audio_url_onyx?: string | null
          body_text: string
          category: string
          closing_prayer?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          daily_practice?: string | null
          id?: string
          is_published?: boolean | null
          language?: string | null
          reflection_question?: string | null
          scheduled_date: string
          supplementary_reading?: string | null
          title: string
          today_action?: string | null
          tts_generated_at?: string | null
          tts_voice?: string | null
        }
        Update: {
          anchor_verse?: string
          anchor_verse_text?: string
          audio_duration_seconds?: number | null
          audio_url?: string | null
          audio_url_alloy?: string | null
          audio_url_nova?: string | null
          audio_url_onyx?: string | null
          body_text?: string
          category?: string
          closing_prayer?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          daily_practice?: string | null
          id?: string
          is_published?: boolean | null
          language?: string | null
          reflection_question?: string | null
          scheduled_date?: string
          supplementary_reading?: string | null
          title?: string
          today_action?: string | null
          tts_generated_at?: string | null
          tts_voice?: string | null
        }
        Relationships: []
      }
      emotional_support_logs: {
        Row: {
          anchor_verse: string | null
          anchor_verse_text: string | null
          audio_url: string | null
          closing_prayer: string | null
          comfort_text: string | null
          created_at: string | null
          detected_emotion: string | null
          feedback_emoji: string | null
          id: string
          role: string | null
          session_id: string | null
          user_id: string | null
          user_input: string
        }
        Insert: {
          anchor_verse?: string | null
          anchor_verse_text?: string | null
          audio_url?: string | null
          closing_prayer?: string | null
          comfort_text?: string | null
          created_at?: string | null
          detected_emotion?: string | null
          feedback_emoji?: string | null
          id?: string
          role?: string | null
          session_id?: string | null
          user_id?: string | null
          user_input: string
        }
        Update: {
          anchor_verse?: string | null
          anchor_verse_text?: string | null
          audio_url?: string | null
          closing_prayer?: string | null
          comfort_text?: string | null
          created_at?: string | null
          detected_emotion?: string | null
          feedback_emoji?: string | null
          id?: string
          role?: string | null
          session_id?: string | null
          user_id?: string | null
          user_input?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotional_support_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "emotional_support_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotional_support_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      emotional_support_sessions: {
        Row: {
          created_at: string | null
          id: string
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expos_studies: {
        Row: {
          conteudo_markdown: string
          created_at: string
          formato: string
          id: string
          idioma: string | null
          passagem: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo_markdown: string
          created_at?: string
          formato: string
          id?: string
          idioma?: string | null
          passagem: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo_markdown?: string
          created_at?: string
          formato?: string
          id?: string
          idioma?: string | null
          passagem?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generation_logs: {
        Row: {
          cost_usd: number | null
          created_at: string
          error_code: string | null
          generation_time_ms: number | null
          id: string
          input_tokens: number | null
          language: string | null
          llm_model: string | null
          material_id: string | null
          mode: string | null
          output_tokens: number | null
          sensitive_topic_detected: string | null
          theology_guardrails_triggered: boolean | null
          user_id: string
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          generation_time_ms?: number | null
          id?: string
          input_tokens?: number | null
          language?: string | null
          llm_model?: string | null
          material_id?: string | null
          mode?: string | null
          output_tokens?: number | null
          sensitive_topic_detected?: string | null
          theology_guardrails_triggered?: boolean | null
          user_id: string
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          generation_time_ms?: number | null
          id?: string
          input_tokens?: number | null
          language?: string | null
          llm_model?: string | null
          material_id?: string | null
          mode?: string | null
          output_tokens?: number | null
          sensitive_topic_detected?: string | null
          theology_guardrails_triggered?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_logs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      illustrations: {
        Row: {
          body: string
          category: string | null
          created_at: string
          hook: string | null
          id: string
          tags: string[] | null
          title: string
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          hook?: string | null
          id?: string
          tags?: string[] | null
          title: string
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          hook?: string | null
          id?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      library_tags: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean | null
          material_id: string
          tag: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          material_id: string
          tag?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          material_id?: string
          tag?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_tags_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          article_title: string | null
          audience: string | null
          bible_passage: string | null
          bible_version: string | null
          category: string | null
          citation_audit: Json | null
          created_at: string
          doctrine_line: string | null
          generation_time_ms: number | null
          id: string
          is_published: boolean | null
          language: string
          meta_description: string | null
          mode: string
          output_bilingual: string | null
          output_blog: string | null
          output_cell: string | null
          output_devotional: string | null
          output_outline: string | null
          output_reels: Json | null
          output_sermon: string | null
          pain_point: string | null
          pastoral_voice: string | null
          published_url: string | null
          sensitive_topic_detected: string | null
          seo_slug: string | null
          tags: string[] | null
          theology_layer_marked: boolean | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          article_title?: string | null
          audience?: string | null
          bible_passage?: string | null
          bible_version?: string | null
          category?: string | null
          citation_audit?: Json | null
          created_at?: string
          doctrine_line?: string | null
          generation_time_ms?: number | null
          id?: string
          is_published?: boolean | null
          language: string
          meta_description?: string | null
          mode: string
          output_bilingual?: string | null
          output_blog?: string | null
          output_cell?: string | null
          output_devotional?: string | null
          output_outline?: string | null
          output_reels?: Json | null
          output_sermon?: string | null
          pain_point?: string | null
          pastoral_voice?: string | null
          published_url?: string | null
          sensitive_topic_detected?: string | null
          seo_slug?: string | null
          tags?: string[] | null
          theology_layer_marked?: boolean | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          article_title?: string | null
          audience?: string | null
          bible_passage?: string | null
          bible_version?: string | null
          category?: string | null
          citation_audit?: Json | null
          created_at?: string
          doctrine_line?: string | null
          generation_time_ms?: number | null
          id?: string
          is_published?: boolean | null
          language?: string
          meta_description?: string | null
          mode?: string
          output_bilingual?: string | null
          output_blog?: string | null
          output_cell?: string | null
          output_devotional?: string | null
          output_outline?: string | null
          output_reels?: Json | null
          output_sermon?: string | null
          pain_point?: string | null
          pastoral_voice?: string | null
          published_url?: string | null
          sensitive_topic_detected?: string | null
          seo_slug?: string | null
          tags?: string[] | null
          theology_layer_marked?: boolean | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      multiply_outputs: {
        Row: {
          content: string
          generated_at: string
          id: string
          material_id: string | null
          output_type: string
          user_id: string
        }
        Insert: {
          content: string
          generated_at?: string
          id?: string
          material_id?: string | null
          output_type: string
          user_id: string
        }
        Update: {
          content?: string
          generated_at?: string
          id?: string
          material_id?: string | null
          output_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiply_outputs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "multiply_outputs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
        }
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          difficulty: string | null
          id: string
          library_id: string | null
          question: string
          reference: string | null
          search_vector: unknown
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          library_id?: string | null
          question: string
          reference?: string | null
          search_vector?: unknown
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          difficulty?: string | null
          id?: string
          library_id?: string | null
          question?: string
          reference?: string | null
          search_vector?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "content_library"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plan_days: {
        Row: {
          book: string | null
          chapters: string | null
          day_number: number
          id: string
          passage: string
          plan_id: string | null
          testament: string | null
          theme: string | null
        }
        Insert: {
          book?: string | null
          chapters?: string | null
          day_number: number
          id?: string
          passage: string
          plan_id?: string | null
          testament?: string | null
          theme?: string | null
        }
        Update: {
          book?: string | null
          chapters?: string | null
          day_number?: number
          id?: string
          passage?: string
          plan_id?: string | null
          testament?: string | null
          theme?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          library_id: string | null
          title: string
          total_days: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          library_id?: string | null
          title: string
          total_days?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          library_id?: string | null
          title?: string
          total_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_plans_library_id_fkey"
            columns: ["library_id"]
            isOneToOne: false
            referencedRelation: "content_library"
            referencedColumns: ["id"]
          },
        ]
      }
      research_cache: {
        Row: {
          background_context: string | null
          created_at: string
          id: string
          original_language_notes: string | null
          query: string | null
          theological_insights: string | null
          verse_reference: string | null
        }
        Insert: {
          background_context?: string | null
          created_at?: string
          id?: string
          original_language_notes?: string | null
          query?: string | null
          theological_insights?: string | null
          verse_reference?: string | null
        }
        Update: {
          background_context?: string | null
          created_at?: string
          id?: string
          original_language_notes?: string | null
          query?: string | null
          theological_insights?: string | null
          verse_reference?: string | null
        }
        Relationships: []
      }
      series: {
        Row: {
          created_at: string
          id: string
          language: string | null
          passages: string[] | null
          theme: string | null
          title: string
          total_weeks: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          passages?: string[] | null
          theme?: string | null
          title: string
          total_weeks?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          passages?: string[] | null
          theme?: string | null
          title?: string
          total_weeks?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "series_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_premium: boolean
          structure: Json
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          structure?: Json
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_premium?: boolean
          structure?: Json
          title?: string
        }
        Relationships: []
      }
      social_calendar: {
        Row: {
          created_at: string
          id: string
          material_id: string | null
          month: string
          posts: Json
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id?: string | null
          month: string
          posts?: Json
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string | null
          month?: string
          posts?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_calendar_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_calendar_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          amount_cents: number | null
          created_at: string
          currency: string | null
          customer_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          plan_from: string | null
          plan_to: string | null
          processed_at: string
          raw_event: Json | null
          status: string | null
          stripe_event_id: string
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          plan_from?: string | null
          plan_to?: string | null
          processed_at?: string
          raw_event?: Json | null
          status?: string | null
          stripe_event_id: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          plan_from?: string | null
          plan_to?: string | null
          processed_at?: string
          raw_event?: Json | null
          status?: string | null
          stripe_event_id?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_cents: number | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_content_bookmarks: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          quiz_id: string | null
          section_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          quiz_id?: string | null
          section_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          quiz_id?: string | null
          section_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_content_bookmarks_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_content_bookmarks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "content_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_content_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devotional_progress: {
        Row: {
          devotional_id: string | null
          id: string
          listened_audio: boolean | null
          read_at: string | null
          reflection_answer: string | null
          user_id: string | null
        }
        Insert: {
          devotional_id?: string | null
          id?: string
          listened_audio?: boolean | null
          read_at?: string | null
          reflection_answer?: string | null
          user_id?: string | null
        }
        Update: {
          devotional_id?: string | null
          id?: string
          listened_audio?: boolean | null
          read_at?: string | null
          reflection_answer?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_devotional_progress_devotional_id_fkey"
            columns: ["devotional_id"]
            isOneToOne: false
            referencedRelation: "devotionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_devotional_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_editorial_profile: {
        Row: {
          active_sites: Json | null
          created_at: string
          depth: string | null
          id: string
          preferred_length: string | null
          priority_themes: string[] | null
          publish_frequency: string | null
          tone: string | null
          updated_at: string
          user_id: string
          writing_style: string | null
        }
        Insert: {
          active_sites?: Json | null
          created_at?: string
          depth?: string | null
          id?: string
          preferred_length?: string | null
          priority_themes?: string[] | null
          publish_frequency?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
          writing_style?: string | null
        }
        Update: {
          active_sites?: Json | null
          created_at?: string
          depth?: string | null
          id?: string
          preferred_length?: string | null
          priority_themes?: string[] | null
          publish_frequency?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
          writing_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_editorial_profile_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading_progress: {
        Row: {
          completed_at: string
          day_number: number
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          day_number: number
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          day_number?: number
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reading_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: string | null
          user_id: string | null
        }
        Insert: {
          role?: string | null
          user_id?: string | null
        }
        Update: {
          role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          bible_version: string | null
          blog_url: string | null
          created_at: string
          doctrine_preference: string | null
          email: string
          full_name: string | null
          generation_count_month: number
          generation_reset_date: string
          handle: string | null
          id: string
          language_preference: string
          pastoral_voice: string | null
          plan: string
          quiz_score: number | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          bible_version?: string | null
          blog_url?: string | null
          created_at?: string
          doctrine_preference?: string | null
          email: string
          full_name?: string | null
          generation_count_month?: number
          generation_reset_date?: string
          handle?: string | null
          id: string
          language_preference?: string
          pastoral_voice?: string | null
          plan?: string
          quiz_score?: number | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          bible_version?: string | null
          blog_url?: string | null
          created_at?: string
          doctrine_preference?: string | null
          email?: string
          full_name?: string | null
          generation_count_month?: number
          generation_reset_date?: string
          handle?: string | null
          id?: string
          language_preference?: string
          pastoral_voice?: string | null
          plan?: string
          quiz_score?: number | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wordpress_sites: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          language: string | null
          site_name: string
          site_type: string
          site_url: string
          updated_at: string
          user_id: string
          wp_app_password: string
          wp_rest_url: string
          wp_username: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          site_name: string
          site_type?: string
          site_url: string
          updated_at?: string
          user_id: string
          wp_app_password: string
          wp_rest_url: string
          wp_username: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          site_name?: string
          site_type?: string
          site_url?: string
          updated_at?: string
          user_id?: string
          wp_app_password?: string
          wp_rest_url?: string
          wp_username?: string
        }
        Relationships: [
          {
            foreignKeyName: "wordpress_sites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_credits: {
        Args: { p_credits: number; p_user_id: string }
        Returns: boolean
      }
      get_user_daily_usage: {
        Args: { p_user_id: string }
        Returns: {
          chapters_read_total: number
          credits_remaining: number
          current_streak: number
          devotional_read_today: boolean
          generations_today: number
          quiz_score: number
        }[]
      }
      get_user_reading_stats: {
        Args: { p_plan_id: string; p_user_id: string }
        Returns: Json
      }
      match_commentary: {
        Args: {
          filter_book?: string
          filter_chapter?: number
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          book: string
          chapter: number
          commentary_text: string
          id: string
          similarity: number
          source: string
          verse_start: number
        }[]
      }
      reset_monthly_generations: { Args: never; Returns: undefined }
      search_biblical_content: {
        Args: {
          category_filter?: string
          limit_count?: number
          query_text: string
          testament_filter?: string
        }
        Returns: {
          book: string
          category: string
          id: string
          rank: number
          reference: string
          summary: string
          testament: string
          title: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
