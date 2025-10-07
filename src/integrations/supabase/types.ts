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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      contratos: {
        Row: {
          conversoes: Json | null
          created_at: string
          fornecedor_id: string
          freight_breaks: Json | null
          id: string
          preco_base: number
          price_breaks: Json | null
          produto_id: string
          unidade: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          user_id: string
          yield_config: Json | null
        }
        Insert: {
          conversoes?: Json | null
          created_at?: string
          fornecedor_id: string
          freight_breaks?: Json | null
          id?: string
          preco_base: number
          price_breaks?: Json | null
          produto_id: string
          unidade: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id: string
          yield_config?: Json | null
        }
        Update: {
          conversoes?: Json | null
          created_at?: string
          fornecedor_id?: string
          freight_breaks?: Json | null
          id?: string
          preco_base?: number
          price_breaks?: Json | null
          produto_id?: string
          unidade?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id?: string
          yield_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacao_fornecedores: {
        Row: {
          ativo: boolean
          cadeia: Json | null
          cbs: number
          cnpj: string | null
          cotacao_id: string
          created_at: string
          fornecedor_id: string | null
          flags_item: Json | null
          frete: number
          ibs: number
          id: string
          is_aliquota: number
          is_refeicao_pronta: boolean | null
          municipio: string | null
          nome: string
          pedido_minimo: number | null
          prazo_entrega_dias: number | null
          prazo_pagamento_dias: number | null
          preco: number
          produto_descricao: string | null
          produto_id: string | null
          regime: Database["public"]["Enums"]["supplier_regime"]
          tipo: Database["public"]["Enums"]["supplier_tipo"]
          uf: string | null
          unidade_negociada: Database["public"]["Enums"]["unit_type"] | null
          contato_nome: string | null
          contato_email: string | null
          contato_telefone: string | null
        }
        Insert: {
          ativo?: boolean
          cadeia?: Json | null
          cbs?: number
          cnpj?: string | null
          cotacao_id: string
          created_at?: string
          fornecedor_id?: string | null
          flags_item?: Json | null
          frete?: number
          ibs?: number
          id?: string
          is_aliquota?: number
          is_refeicao_pronta?: boolean | null
          municipio?: string | null
          nome: string
          pedido_minimo?: number | null
          prazo_entrega_dias?: number | null
          prazo_pagamento_dias?: number | null
          preco: number
          produto_descricao?: string | null
          produto_id?: string | null
          regime: Database["public"]["Enums"]["supplier_regime"]
          tipo: Database["public"]["Enums"]["supplier_tipo"]
          uf?: string | null
          unidade_negociada?: Database["public"]["Enums"]["unit_type"] | null
          contato_nome?: string | null
          contato_email?: string | null
          contato_telefone?: string | null
        }
        Update: {
          ativo?: boolean
          cadeia?: Json | null
          cbs?: number
          cnpj?: string | null
          cotacao_id?: string
          created_at?: string
          fornecedor_id?: string | null
          flags_item?: Json | null
          frete?: number
          ibs?: number
          id?: string
          is_aliquota?: number
          is_refeicao_pronta?: boolean | null
          municipio?: string | null
          nome?: string
          pedido_minimo?: number | null
          prazo_entrega_dias?: number | null
          prazo_pagamento_dias?: number | null
          preco?: number
          produto_descricao?: string | null
          produto_id?: string | null
          regime?: Database["public"]["Enums"]["supplier_regime"]
          tipo?: Database["public"]["Enums"]["supplier_tipo"]
          uf?: string | null
          unidade_negociada?: Database["public"]["Enums"]["unit_type"] | null
          contato_nome?: string | null
          contato_email?: string | null
          contato_telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cotacao_fornecedores_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacao_fornecedores_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacao_fornecedores_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes: {
        Row: {
          created_at: string
          data_cotacao: string
          destino: Database["public"]["Enums"]["destinacao_tipo"]
          id: string
          municipio: string | null
          nome: string
          produto: string
          regime: Database["public"]["Enums"]["supplier_regime"]
          scenario: string
          uf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_cotacao: string
          destino: Database["public"]["Enums"]["destinacao_tipo"]
          id?: string
          municipio?: string | null
          nome: string
          produto: string
          regime: Database["public"]["Enums"]["supplier_regime"]
          scenario?: string
          uf: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_cotacao?: string
          destino?: Database["public"]["Enums"]["destinacao_tipo"]
          id?: string
          municipio?: string | null
          nome?: string
          produto?: string
          regime?: Database["public"]["Enums"]["supplier_regime"]
          scenario?: string
          uf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          created_at: string
          id: string
          municipio: string | null
          nome: string
          regime: Database["public"]["Enums"]["supplier_regime"]
          tipo: Database["public"]["Enums"]["supplier_tipo"]
          uf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          id?: string
          municipio?: string | null
          nome: string
          regime?: Database["public"]["Enums"]["supplier_regime"]
          tipo?: Database["public"]["Enums"]["supplier_tipo"]
          uf?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          created_at?: string
          id?: string
          municipio?: string | null
          nome?: string
          regime?: Database["public"]["Enums"]["supplier_regime"]
          tipo?: Database["public"]["Enums"]["supplier_tipo"]
          uf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string | null
          cest: string | null
          created_at: string
          descricao: string
          flag_cesta: boolean
          flag_is: boolean
          flag_reducao: boolean
          flag_refeicao: boolean
          id: string
          ncm: string
          codigo_interno: string | null
          unidade_padrao: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          cest?: string | null
          created_at?: string
          descricao: string
          flag_cesta?: boolean
          flag_is?: boolean
          flag_reducao?: boolean
          flag_refeicao?: boolean
          id?: string
          ncm: string
          codigo_interno?: string | null
          unidade_padrao?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          cest?: string | null
          created_at?: string
          descricao?: string
          flag_cesta?: boolean
          flag_is?: boolean
          flag_reducao?: boolean
          flag_refeicao?: boolean
          id?: string
          ncm?: string
          codigo_interno?: string | null
          unidade_padrao?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      receitas: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      regras_ncm: {
        Row: {
          aliquota_cbs: number
          aliquota_ibs: number
          aliquota_is: number
          created_at: string
          descricao: string
          id: string
          ncm: string
          overrides_uf: Json | null
          prioridade: number | null
          receita_codigo: string
          receita_descricao: string
          updated_at: string
          user_id: string
          vigencia_fim: string | null
          vigencia_inicio: string | null
        }
        Insert: {
          aliquota_cbs?: number
          aliquota_ibs?: number
          aliquota_is?: number
          created_at?: string
          descricao: string
          id?: string
          ncm: string
          overrides_uf?: Json | null
          prioridade?: number | null
          receita_codigo: string
          receita_descricao: string
          updated_at?: string
          user_id: string
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Update: {
          aliquota_cbs?: number
          aliquota_ibs?: number
          aliquota_is?: number
          created_at?: string
          descricao?: string
          id?: string
          ncm?: string
          overrides_uf?: Json | null
          prioridade?: number | null
          receita_codigo?: string
          receita_descricao?: string
          updated_at?: string
          user_id?: string
          vigencia_fim?: string | null
          vigencia_inicio?: string | null
        }
        Relationships: []
      }
      unidades_conversao: {
        Row: {
          created_at: string
          de: Database["public"]["Enums"]["unit_type"]
          fator: number
          id: string
          para: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          de: Database["public"]["Enums"]["unit_type"]
          fator: number
          id?: string
          para: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          de?: Database["public"]["Enums"]["unit_type"]
          fator?: number
          id?: string
          para?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      unidades_yield: {
        Row: {
          created_at: string
          entrada: Database["public"]["Enums"]["unit_type"]
          id: string
          rendimento: number
          saida: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entrada: Database["public"]["Enums"]["unit_type"]
          id?: string
          rendimento: number
          saida: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entrada?: Database["public"]["Enums"]["unit_type"]
          id?: string
          rendimento?: number
          saida?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      destinacao_tipo: "A" | "B" | "C" | "D" | "E"
      supplier_regime: "normal" | "simples" | "presumido"
      supplier_tipo:
        | "industria"
        | "distribuidor"
        | "produtor"
        | "atacado"
        | "varejo"
      unit_type: "un" | "kg" | "g" | "l" | "ml" | "ton"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      destinacao_tipo: ["A", "B", "C", "D", "E"],
      supplier_regime: ["normal", "simples", "presumido"],
      supplier_tipo: [
        "industria",
        "distribuidor",
        "produtor",
        "atacado",
        "varejo",
      ],
      unit_type: ["un", "kg", "g", "l", "ml", "ton"],
    },
  },
} as const
