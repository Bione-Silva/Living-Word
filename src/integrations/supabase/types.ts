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
      editorial_queue: {
        Row: {
          created_at: string
          id: string
          material_id: string | null
          published_at: string | null
          scheduled_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "editorial_queue_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      expos_studies: {
        Row: {
          conteudo_markdown: string
          created_at: string
          formato: string
          id: string
          passagem: string
          titulo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conteudo_markdown?: string
          created_at?: string
          formato?: string
          id?: string
          passagem: string
          titulo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conteudo_markdown?: string
          created_at?: string
          formato?: string
          id?: string
          passagem?: string
          titulo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generation_logs: {
        Row: {
          cost_usd: number
          created_at: string
          feature: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          total_tokens: number
          user_id: string
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          feature: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          total_tokens?: number
          user_id: string
        }
        Update: {
          cost_usd?: number
          created_at?: string
          feature?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      master_api_vault: {
        Row: {
          api_key: string
          id: string
          provider_id: string
          updated_at: string
        }
        Insert: {
          api_key: string
          id?: string
          provider_id: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          id?: string
          provider_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          material_title: string | null
          material_type: string
          rating: string
          tool_id: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          material_title?: string | null
          material_type: string
          rating: string
          tool_id?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          material_title?: string | null
          material_type?: string
          rating?: string
          tool_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          article_images: Json | null
          bible_version: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          favorite: boolean | null
          id: string
          language: string | null
          passage: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          article_images?: Json | null
          bible_version?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          favorite?: boolean | null
          id?: string
          language?: string | null
          passage?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          article_images?: Json | null
          bible_version?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          favorite?: boolean | null
          id?: string
          language?: string | null
          passage?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mind_settings: {
        Row: {
          active: boolean
          id: string
          mind_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          id?: string
          mind_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          id?: string
          mind_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_financials: {
        Row: {
          created_at: string
          expenses: number
          id: string
          month: string
          notes: string | null
          revenue: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          expenses?: number
          id?: string
          month: string
          notes?: string | null
          revenue?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          expenses?: number
          id?: string
          month?: string
          notes?: string | null
          revenue?: number
          updated_at?: string
        }
        Relationships: []
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
          audience: string | null
          avatar_url: string | null
          bible_version: string | null
          bio: string | null
          blog_handle: string | null
          blog_name: string | null
          church_name: string | null
          church_role: string | null
          city: string | null
          country: string | null
          created_at: string
          denomination: string | null
          doctrine: string | null
          favorite_preacher: string | null
          font_family: string | null
          full_name: string
          generations_limit: number
          generations_used: number
          id: string
          language: string
          layout_style: string | null
          neighborhood: string | null
          pastoral_voice: string | null
          phone: string | null
          plan: string
          preaching_style: string | null
          profile_completed: boolean | null
          state: string | null
          street: string | null
          theme_color: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          wordpress_url: string | null
          zip_code: string | null
        }
        Insert: {
          audience?: string | null
          avatar_url?: string | null
          bible_version?: string | null
          bio?: string | null
          blog_handle?: string | null
          blog_name?: string | null
          church_name?: string | null
          church_role?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          denomination?: string | null
          doctrine?: string | null
          favorite_preacher?: string | null
          font_family?: string | null
          full_name?: string
          generations_limit?: number
          generations_used?: number
          id: string
          language?: string
          layout_style?: string | null
          neighborhood?: string | null
          pastoral_voice?: string | null
          phone?: string | null
          plan?: string
          preaching_style?: string | null
          profile_completed?: boolean | null
          state?: string | null
          street?: string | null
          theme_color?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          wordpress_url?: string | null
          zip_code?: string | null
        }
        Update: {
          audience?: string | null
          avatar_url?: string | null
          bible_version?: string | null
          bio?: string | null
          blog_handle?: string | null
          blog_name?: string | null
          church_name?: string | null
          church_role?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          denomination?: string | null
          doctrine?: string | null
          favorite_preacher?: string | null
          font_family?: string | null
          full_name?: string
          generations_limit?: number
          generations_used?: number
          id?: string
          language?: string
          layout_style?: string | null
          neighborhood?: string | null
          pastoral_voice?: string | null
          phone?: string | null
          plan?: string
          preaching_style?: string | null
          profile_completed?: boolean | null
          state?: string | null
          street?: string | null
          theme_color?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          wordpress_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          id: string
          invite_token: string | null
          invited_by: string | null
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          id?: string
          invite_token?: string | null
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          invite_token?: string | null
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_saas_metrics: {
        Row: {
          estimated_mrr_usd: number | null
          total_users_registered: number | null
          users_church: number | null
          users_free: number | null
          users_ministry: number | null
          users_pastoral: number | null
          users_trialing: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_admin_ai_metrics: { Args: never; Returns: Json }
      get_admin_saas_metrics: {
        Args: never
        Returns: {
          estimated_mrr_usd: number
          total_users_registered: number
          users_church: number
          users_free: number
          users_ministry: number
          users_pastoral: number
          users_trialing: number
        }[]
      }
      get_public_blog_article: {
        Args: { p_article_id: string }
        Returns: {
          article_images: Json
          bible_version: string
          content: string
          cover_image_url: string
          created_at: string
          favorite: boolean
          id: string
          language: string
          passage: string
          title: string
          type: string
          updated_at: string
        }[]
      }
      get_public_blog_articles: {
        Args: { p_handle: string }
        Returns: {
          article_images: Json
          content: string
          cover_image_url: string
          created_at: string
          id: string
          language: string
          passage: string
          published_at: string
          title: string
          updated_at: string
        }[]
      }
      get_public_blog_profile: {
        Args: { p_handle: string }
        Returns: {
          avatar_url: string
          bio: string
          blog_handle: string
          blog_name: string
          church_name: string
          city: string
          country: string
          font_family: string
          full_name: string
          id: string
          language: string
          layout_style: string
          theme_color: string
        }[]
      }
      get_public_blog_siblings: {
        Args: { p_article_id: string }
        Returns: {
          id: string
          language: string
          title: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
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
