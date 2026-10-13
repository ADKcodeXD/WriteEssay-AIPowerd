export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      article: {
        Row: {
          article_cover: string | null
          article_example: Json | null
          article_grade: string | null
          article_shortcut: Json | null
          article_source: string | null
          article_tag: number[] | null
          article_tasktype: number | null
          article_theme: number[] | null
          article_title: string | null
          created_at: string | null
          id: number
        }
        Insert: {
          article_cover?: string | null
          article_example?: Json | null
          article_grade?: string | null
          article_shortcut?: Json | null
          article_source?: string | null
          article_tag?: number[] | null
          article_tasktype?: number | null
          article_theme?: number[] | null
          article_title?: string | null
          created_at?: string | null
          id?: number
        }
        Update: {
          article_cover?: string | null
          article_example?: Json | null
          article_grade?: string | null
          article_shortcut?: Json | null
          article_source?: string | null
          article_tag?: number[] | null
          article_tasktype?: number | null
          article_theme?: number[] | null
          article_title?: string | null
          created_at?: string | null
          id?: number
        }
        Relationships: []
      }
      chargelog: {
        Row: {
          charge_amount: number | null
          charge_desc: string | null
          charge_payment: string | null
          charge_source: number | null
          charge_type: number | null
          created_at: string
          id: number
          user_id: number
        }
        Insert: {
          charge_amount?: number | null
          charge_desc?: string | null
          charge_payment?: string | null
          charge_source?: number | null
          charge_type?: number | null
          created_at?: string
          id?: number
          user_id: number
        }
        Update: {
          charge_amount?: number | null
          charge_desc?: string | null
          charge_payment?: string | null
          charge_source?: number | null
          charge_type?: number | null
          created_at?: string
          id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chargelog_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      modeloutputrecord: {
        Row: {
          article_id: number | null
          created_at: string | null
          ext1: string | null
          ext2: string | null
          ext3: string | null
          ext4: string | null
          ext5: string | null
          ext6: Json | null
          id: number
          locale: string | null
          log_id: number | null
          model: string | null
          model_input: Json | null
          model_output: Json | null
          price: number | null
          translate_id: number | null
          type: string | null
          usage: Json | null
          user_uuid: string | null
          word_id: number | null
        }
        Insert: {
          article_id?: number | null
          created_at?: string | null
          ext1?: string | null
          ext2?: string | null
          ext3?: string | null
          ext4?: string | null
          ext5?: string | null
          ext6?: Json | null
          id?: number
          locale?: string | null
          log_id?: number | null
          model?: string | null
          model_input?: Json | null
          model_output?: Json | null
          price?: number | null
          translate_id?: number | null
          type?: string | null
          usage?: Json | null
          user_uuid?: string | null
          word_id?: number | null
        }
        Update: {
          article_id?: number | null
          created_at?: string | null
          ext1?: string | null
          ext2?: string | null
          ext3?: string | null
          ext4?: string | null
          ext5?: string | null
          ext6?: Json | null
          id?: number
          locale?: string | null
          log_id?: number | null
          model?: string | null
          model_input?: Json | null
          model_output?: Json | null
          price?: number | null
          translate_id?: number | null
          type?: string | null
          usage?: Json | null
          user_uuid?: string | null
          word_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "modeloutputrecord_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      question_relate: {
        Row: {
          article_id: number | null
          created_at: string
          id: number
          quetions_id: number | null
        }
        Insert: {
          article_id?: number | null
          created_at?: string
          id?: number
          quetions_id?: number | null
        }
        Update: {
          article_id?: number | null
          created_at?: string
          id?: number
          quetions_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "question_relate_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_relate_quetions_id_fkey"
            columns: ["quetions_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          cover: string | null
          created_at: string
          created_by: string | null
          id: number
          permission_type: number | null
          set_desc: Json | null
          set_name: Json | null
          set_type: string | null
        }
        Insert: {
          cover?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          permission_type?: number | null
          set_desc?: Json | null
          set_name?: Json | null
          set_type?: string | null
        }
        Update: {
          cover?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          permission_type?: number | null
          set_desc?: Json | null
          set_name?: Json | null
          set_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      ratelog: {
        Row: {
          article_id: number | null
          created_at: string | null
          grade: string | null
          id: number
          record_id: number | null
          record_input: Json | null
          record_output: Json | null
          status: number | null
          type: string | null
          user_uuid: string | null
        }
        Insert: {
          article_id?: number | null
          created_at?: string | null
          grade?: string | null
          id?: number
          record_id?: number | null
          record_input?: Json | null
          record_output?: Json | null
          status?: number | null
          type?: string | null
          user_uuid?: string | null
        }
        Update: {
          article_id?: number | null
          created_at?: string | null
          grade?: string | null
          id?: number
          record_id?: number | null
          record_input?: Json | null
          record_output?: Json | null
          status?: number | null
          type?: string | null
          user_uuid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratelog_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "article"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratelog_user_uuid_fkey"
            columns: ["user_uuid"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_uuid"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          id?: number
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          id?: number
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      tag: {
        Row: {
          created_at: string | null
          id: number
          tag_desc: string | null
          tag_i18n: Json | null
          tag_name: string | null
          tag_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          tag_desc?: string | null
          tag_i18n?: Json | null
          tag_name?: string | null
          tag_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          tag_desc?: string | null
          tag_i18n?: Json | null
          tag_name?: string | null
          tag_type?: string | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          created_at: string | null
          id: number
          theme_desc: string | null
          theme_i18n: Json | null
          theme_name: string | null
          theme_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          theme_desc?: string | null
          theme_i18n?: Json | null
          theme_name?: string | null
          theme_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          theme_desc?: string | null
          theme_i18n?: Json | null
          theme_name?: string | null
          theme_type?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: number
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: number
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          high_quota: number | null
          id: number
          normal_quota: number | null
          user_avatar: string | null
          user_desc: string | null
          user_email: string | null
          user_ext1: Json | null
          user_ext2: string | null
          user_ext3: string | null
          user_ext4: Json | null
          user_ext5: Json | null
          user_ext6: Json | null
          user_gender: number | null
          user_level: number | null
          user_location: string | null
          user_name: string | null
          user_password: string | null
          user_phone: string | null
          user_role: string | null
          user_source: string | null
          user_status: number | null
          user_tags: Json | null
          user_uuid: string | null
        }
        Insert: {
          created_at?: string | null
          high_quota?: number | null
          id?: number
          normal_quota?: number | null
          user_avatar?: string | null
          user_desc?: string | null
          user_email?: string | null
          user_ext1?: Json | null
          user_ext2?: string | null
          user_ext3?: string | null
          user_ext4?: Json | null
          user_ext5?: Json | null
          user_ext6?: Json | null
          user_gender?: number | null
          user_level?: number | null
          user_location?: string | null
          user_name?: string | null
          user_password?: string | null
          user_phone?: string | null
          user_role?: string | null
          user_source?: string | null
          user_status?: number | null
          user_tags?: Json | null
          user_uuid?: string | null
        }
        Update: {
          created_at?: string | null
          high_quota?: number | null
          id?: number
          normal_quota?: number | null
          user_avatar?: string | null
          user_desc?: string | null
          user_email?: string | null
          user_ext1?: Json | null
          user_ext2?: string | null
          user_ext3?: string | null
          user_ext4?: Json | null
          user_ext5?: Json | null
          user_ext6?: Json | null
          user_gender?: number | null
          user_level?: number | null
          user_location?: string | null
          user_name?: string | null
          user_password?: string | null
          user_phone?: string | null
          user_role?: string | null
          user_source?: string | null
          user_status?: number | null
          user_tags?: Json | null
          user_uuid?: string | null
        }
        Relationships: []
      }
      word: {
        Row: {
          created_at: string | null
          id: number
          word: string | null
          word_desc: string | null
          word_ext: Json | null
          word_related: Json | null
          word_sentence: string[] | null
          word_tag: number[] | null
        }
        Insert: {
          created_at?: string | null
          id: number
          word?: string | null
          word_desc?: string | null
          word_ext?: Json | null
          word_related?: Json | null
          word_sentence?: string[] | null
          word_tag?: number[] | null
        }
        Update: {
          created_at?: string | null
          id?: number
          word?: string | null
          word_desc?: string | null
          word_ext?: Json | null
          word_related?: Json | null
          word_sentence?: string[] | null
          word_tag?: number[] | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authorize: {
        Args: {
          requested_permission: Database["public"]["Enums"]["app_permission"]
        }
        Returns: boolean
      }
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      custom_access_token_hook: {
        Args: {
          event: Json
        }
        Returns: Json
      }
      deduct_user_high_quota: {
        Args: {
          p_user_uuid: string
          p_tokens: number
        }
        Returns: undefined
      }
      deduct_user_normal_quota: {
        Args: {
          p_user_uuid: string
          p_tokens: number
        }
        Returns: undefined
      }
      get_article: {
        Args: {
          p_id?: number
          p_user_uuid?: string
        }
        Returns: Record<string, unknown>
      }
      get_articles_with_tags: {
        Args: {
          p_id?: number
          p_keyword?: string
          p_tag_list?: number[]
          p_order_by?: string
          p_sort_type?: string
          p_grade?: string
          p_type?: number
          p_user_uuid?: string
        }
        Returns: Record<string, unknown>[]
      }
      get_essay_statistics: {
        Args: {
          p_user_uuid: string
          p_grade: string
        }
        Returns: {
          total_essays: number
          highest_score: number
          lowest_score: number
          avg_overall_score: number
          avg_grammatical_score: number
          avg_task_score: number
          avg_lexical_score: number
          avg_coherence_score: number
          avg_time: number
        }[]
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      app_permission:
        | "users.update"
        | "users.delete"
        | "users.self_update"
        | "users.self_view"
        | "users.insert"
        | "users.view"
        | "article.delete"
        | "article.insert"
        | "article.update"
        | "modelrecord.update"
        | "modelrecord.insert"
        | "modelrecord.delete"
        | "questions.delete"
        | "questions.insert"
        | "questions.update"
        | "permission.update"
        | "permission.roledelete"
        | "permission.roleadd"
        | "permission.useroledelete"
        | "permission.useroleadd"
        | "permission.useroleupdate"
      app_role: "admin" | "subadmin" | "vip" | "guest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
