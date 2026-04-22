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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      departments: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          id: number
          name: string | null
          parent_id: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          name?: string | null
          parent_id?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          name?: string | null
          parent_id?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          department: string | null
          department_id: number | null
          email: string
          employee_code: string | null
          full_name: string
          id: number
          is_admin: boolean
          job_title: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          department_id?: number | null
          email: string
          employee_code?: string | null
          full_name: string
          id?: number
          is_admin?: boolean
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          department_id?: number | null
          email?: string
          employee_code?: string | null
          full_name?: string
          id?: number
          is_admin?: boolean
          job_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          created_at: string
          created_by: number | null
          deleted_at: string | null
          id: number
          label: string
          slug: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          label: string
          slug: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          id?: number
          label?: string
          slug?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "hashtags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      kudo_hashtags: {
        Row: {
          created_at: string
          hashtag_id: number
          kudo_id: number
        }
        Insert: {
          created_at?: string
          hashtag_id: number
          kudo_id: number
        }
        Update: {
          created_at?: string
          hashtag_id?: number
          kudo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "kudo_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudo_hashtags_kudo_id_fkey"
            columns: ["kudo_id"]
            isOneToOne: false
            referencedRelation: "kudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudo_hashtags_kudo_id_fkey"
            columns: ["kudo_id"]
            isOneToOne: false
            referencedRelation: "kudos_with_heart_count"
            referencedColumns: ["id"]
          },
        ]
      }
      kudo_hearts: {
        Row: {
          created_at: string
          employee_id: number
          kudo_id: number
        }
        Insert: {
          created_at?: string
          employee_id: number
          kudo_id: number
        }
        Update: {
          created_at?: string
          employee_id?: number
          kudo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "kudo_hearts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudo_hearts_kudo_id_fkey"
            columns: ["kudo_id"]
            isOneToOne: false
            referencedRelation: "kudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudo_hearts_kudo_id_fkey"
            columns: ["kudo_id"]
            isOneToOne: false
            referencedRelation: "kudos_with_heart_count"
            referencedColumns: ["id"]
          },
        ]
      }
      kudo_images: {
        Row: {
          created_at: string
          kudo_id: number
          position: number
          upload_id: number
        }
        Insert: {
          created_at?: string
          kudo_id: number
          position: number
          upload_id: number
        }
        Update: {
          created_at?: string
          kudo_id?: number
          position?: number
          upload_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "kudo_images_kudo_id_fkey"
            columns: ["kudo_id"]
            isOneToOne: false
            referencedRelation: "kudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudo_images_kudo_id_fkey"
            columns: ["kudo_id"]
            isOneToOne: false
            referencedRelation: "kudos_with_heart_count"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudo_images_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      kudo_mentions: {
        Row: {
          created_at: string
          employee_id: number
          kudo_id: number
        }
        Insert: {
          created_at?: string
          employee_id: number
          kudo_id: number
        }
        Update: {
          created_at?: string
          employee_id?: number
          kudo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "kudo_mentions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudo_mentions_kudo_id_fkey"
            columns: ["kudo_id"]
            isOneToOne: false
            referencedRelation: "kudos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudo_mentions_kudo_id_fkey"
            columns: ["kudo_id"]
            isOneToOne: false
            referencedRelation: "kudos_with_heart_count"
            referencedColumns: ["id"]
          },
        ]
      }
      kudos: {
        Row: {
          anonymous_alias: string | null
          author_id: number
          body: Json
          body_plain: string
          created_at: string
          deleted_at: string | null
          id: number
          is_anonymous: boolean
          recipient_id: number
          status: string
          title_id: number
          updated_at: string
        }
        Insert: {
          anonymous_alias?: string | null
          author_id: number
          body: Json
          body_plain: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          is_anonymous?: boolean
          recipient_id: number
          status?: string
          title_id: number
          updated_at?: string
        }
        Update: {
          anonymous_alias?: string | null
          author_id?: number
          body?: Json
          body_plain?: string
          created_at?: string
          deleted_at?: string | null
          id?: number
          is_anonymous?: boolean
          recipient_id?: number
          status?: string
          title_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kudos_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          created_at: string
          created_by: number | null
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: number
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: number | null
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "titles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          byte_size: number
          created_at: string
          deleted_at: string | null
          height: number | null
          id: number
          mime_type: string
          owner_id: number
          storage_key: string
          width: number | null
        }
        Insert: {
          byte_size: number
          created_at?: string
          deleted_at?: string | null
          height?: number | null
          id?: number
          mime_type: string
          owner_id: number
          storage_key: string
          width?: number | null
        }
        Update: {
          byte_size?: number
          created_at?: string
          deleted_at?: string | null
          height?: number | null
          id?: number
          mime_type?: string
          owner_id?: number
          storage_key?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "uploads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      kudos_with_heart_count: {
        Row: {
          anonymous_alias: string | null
          author_id: number | null
          body: Json | null
          body_plain: string | null
          created_at: string | null
          deleted_at: string | null
          heart_count: number | null
          id: number | null
          is_anonymous: boolean | null
          recipient_id: number | null
          status: string | null
          title_id: number | null
          updated_at: string | null
        }
        Insert: {
          anonymous_alias?: string | null
          author_id?: number | null
          body?: Json | null
          body_plain?: string | null
          created_at?: string | null
          deleted_at?: string | null
          heart_count?: never
          id?: number | null
          is_anonymous?: boolean | null
          recipient_id?: number | null
          status?: string | null
          title_id?: number | null
          updated_at?: string | null
        }
        Update: {
          anonymous_alias?: string | null
          author_id?: number | null
          body?: Json | null
          body_plain?: string | null
          created_at?: string | null
          deleted_at?: string | null
          heart_count?: never
          id?: number | null
          is_anonymous?: boolean | null
          recipient_id?: number | null
          status?: string | null
          title_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kudos_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kudos_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
