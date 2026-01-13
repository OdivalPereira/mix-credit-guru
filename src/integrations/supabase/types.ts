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
      activity_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          calculated_tax: number | null
          created_at: string
          details: Json | null
          id: string
          ncm: string | null
          request_id: string
          user_id: string | null
        }
        Insert: {
          calculated_tax?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          ncm?: string | null
          request_id?: string
          user_id?: string | null
        }
        Update: {
          calculated_tax?: number | null
          created_at?: string
          details?: Json | null
          id?: string
          ncm?: string | null
          request_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contratos: {
        Row: {
          created_at: string
          id: string
          preco_base: number
          produto_id: string
          unidade: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preco_base: number
          produto_id: string
          unidade: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preco_base?: number
          produto_id?: string
          unidade?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
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
          cotacao_id: string
          fornecedor_id: string
          id: string
        }
        Insert: {
          cotacao_id: string
          fornecedor_id: string
          id?: string
        }
        Update: {
          cotacao_id?: string
          fornecedor_id?: string
          id?: string
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
        ]
      }
      cotacoes: {
        Row: {
          created_at: string
          data: string
          destino: Database["public"]["Enums"]["destinacao_tipo"]
          id: string
          produto_id: string
          regime: Database["public"]["Enums"]["supplier_regime"]
          uf: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          destino: Database["public"]["Enums"]["destinacao_tipo"]
          id?: string
          produto_id: string
          regime: Database["public"]["Enums"]["supplier_regime"]
          uf: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          destino?: Database["public"]["Enums"]["destinacao_tipo"]
          id?: string
          produto_id?: string
          regime?: Database["public"]["Enums"]["supplier_regime"]
          uf?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato: Json | null
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
          contato?: Json | null
          created_at?: string
          id?: string
          municipio?: string | null
          nome: string
          regime: Database["public"]["Enums"]["supplier_regime"]
          tipo: Database["public"]["Enums"]["supplier_tipo"]
          uf: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          contato?: Json | null
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
      ncm_rules: {
        Row: {
          aliquota_cbs: number
          aliquota_ibs: number
          aliquota_is: number
          created_at: string
          date_end: string | null
          date_start: string
          explanation_md: string | null
          id: string
          last_verified_at: string | null
          legal_reference: string | null
          ncm: string
          uf: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aliquota_cbs: number
          aliquota_ibs: number
          aliquota_is: number
          created_at?: string
          date_end?: string | null
          date_start: string
          explanation_md?: string | null
          id?: string
          last_verified_at?: string | null
          legal_reference?: string | null
          ncm: string
          uf: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aliquota_cbs?: number
          aliquota_ibs?: number
          aliquota_is?: number
          created_at?: string
          date_end?: string | null
          date_start?: string
          explanation_md?: string | null
          id?: string
          last_verified_at?: string | null
          legal_reference?: string | null
          ncm?: string
          uf?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ofertas_fornecedor: {
        Row: {
          ativa: boolean
          cadeia: string[] | null
          cbs: number
          created_at: string
          explanation: string | null
          flags_item: Json | null
          fornecedor_id: string
          frete: number
          id: string
          ibs: number
          is: number
          is_refeicao_pronta: boolean
          pedido_minimo: number | null
          prazo_entrega_dias: number | null
          prazo_pagamento_dias: number | null
          preco: number
          produto_id: string
          unidade_negociada: Database["public"]["Enums"]["unit_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativa?: boolean
          cadeia?: string[] | null
          cbs: number
          created_at?: string
          explanation?: string | null
          flags_item?: Json | null
          fornecedor_id: string
          frete: number
          id?: string
          ibs: number
          is: number
          is_refeicao_pronta?: boolean
          pedido_minimo?: number | null
          prazo_entrega_dias?: number | null
          prazo_pagamento_dias?: number | null
          preco: number
          produto_id: string
          unidade_negociada?: Database["public"]["Enums"]["unit_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativa?: boolean
          cadeia?: string[] | null
          cbs?: number
          created_at?: string
          explanation?: string | null
          flags_item?: Json | null
          fornecedor_id?: string
          frete?: number
          id?: string
          ibs?: number
          is?: number
          is_refeicao_pronta?: boolean
          pedido_minimo?: number | null
          prazo_entrega_dias?: number | null
          prazo_pagamento_dias?: number | null
          preco?: number
          produto_id?: string
          unidade_negociada?: Database["public"]["Enums"]["unit_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_fornecedor_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_fornecedor_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string | null
          cest: string | null
          codigo_interno: string | null
          created_at: string
          descricao: string
          flags: Json
          id: string
          ncm: string
          unidade_padrao: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          cest?: string | null
          codigo_interno?: string | null
          created_at?: string
          descricao: string
          flags?: Json
          id?: string
          ncm: string
          unidade_padrao?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          cest?: string | null
          codigo_interno?: string | null
          created_at?: string
          descricao?: string
          flags?: Json
          id?: string
          ncm?: string
          unidade_padrao?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      receitas: {
        Row: {
          codigo: string
          created_at: string
          descricao: string
          id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          descricao: string
          id?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
        }
        Relationships: []
      }
      silver_tax_layer: {
        Row: {
          classificacao: Json
          created_at: string | null
          descricao: string
          id: string
          ncm: string
          source: string
          updated_at: string | null
        }
        Insert: {
          classificacao: Json
          created_at?: string | null
          descricao: string
          id?: string
          ncm: string
          source: string
          updated_at?: string | null
        }
        Update: {
          classificacao?: Json
          created_at?: string | null
          descricao?: string
          id?: string
          ncm?: string
          source?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_rules_gov: {
        Row: {
          anexo_id: string | null
          base_legal: string | null
          codigo: string
          created_at: string
          descricao: string
          id: string
          tipo_aliquota: string | null
        }
        Insert: {
          anexo_id?: string | null
          base_legal?: string | null
          codigo: string
          created_at?: string
          descricao: string
          id?: string
          tipo_aliquota?: string | null
        }
        Update: {
          anexo_id?: string | null
          base_legal?: string | null
          codigo?: string
          created_at?: string
          descricao?: string
          id?: string
          tipo_aliquota?: string | null
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
      [_ in never]: never
    }
    Enums: {
      activity_type:
      | "produto_criado"
      | "produto_atualizado"
      | "produto_excluido"
      | "fornecedor_criado"
      | "fornecedor_atualizado"
      | "fornecedor_excluido"
      | "contrato_criado"
      | "contrato_atualizado"
      | "contrato_excluido"
      | "cotacao_criada"
      | "cotacao_atualizada"
      | "cotacao_excluida"
      | "regra_criada"
      | "regra_atualizada"
      | "regra_excluida"
      | "login"
      | "logout"
      | "perfil_atualizado"
      | "demo_carregado"
      | "configuracao_alterada"
      app_role: "admin" | "moderator" | "user"
      destinacao_tipo: "A" | "B" | "C" | "D" | "E"
      supplier_regime: "normal" | "simples" | "presumido"
      supplier_tipo: "industria" | "distribuidor" | "produtor" | "atacado" | "varejo"
      unit_type: "un" | "kg" | "g" | "l" | "ml" | "ton"
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
