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
          ativo: boolean | null
          condicao_pagamento: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          fornecedor_id: string | null
          id: string
          moeda: string | null
          numero: string
          observacoes: string | null
          updated_at: string | null
          valor_total: number | null
        }
        Insert: {
          ativo?: boolean | null
          condicao_pagamento?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          fornecedor_id?: string | null
          id?: string
          moeda?: string | null
          numero: string
          observacoes?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Update: {
          ativo?: boolean | null
          condicao_pagamento?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          fornecedor_id?: string | null
          id?: string
          moeda?: string | null
          numero?: string
          observacoes?: string | null
          updated_at?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacao_fornecedores: {
        Row: {
          cotacao_id: string | null
          created_at: string | null
          fornecedor_id: string | null
          id: string
          responded_at: string | null
          status: string | null
        }
        Insert: {
          cotacao_id?: string | null
          created_at?: string | null
          fornecedor_id?: string | null
          id?: string
          responded_at?: string | null
          status?: string | null
        }
        Update: {
          cotacao_id?: string | null
          created_at?: string | null
          fornecedor_id?: string | null
          id?: string
          responded_at?: string | null
          status?: string | null
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
          created_at: string | null
          created_by: string | null
          data_abertura: string | null
          data_fechamento: string | null
          descricao: string | null
          id: string
          status: string | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_abertura?: string | null
          data_fechamento?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          titulo?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          categoria: string | null
          city: string | null
          cnpj: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          descricao: string | null
          id: string
          is_active: boolean | null
          last_purchase_date: string | null
          name: string
          notes: string | null
          payment_terms: string | null
          postal_code: string | null
          rating: number | null
          state: string | null
          street: string | null
          supplier_type:
          | Database["public"]["Enums"]["supplier_tipo"]
          | null
          tax_regime:
          | Database["public"]["Enums"]["supplier_regime"]
          | null
          total_purchases_value: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          categoria?: string | null
          city?: string | null
          cnpj: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase_date?: string | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          postal_code?: string | null
          rating?: number | null
          state?: string | null
          street?: string | null
          supplier_type?:
          | Database["public"]["Enums"]["supplier_tipo"]
          | null
          tax_regime?:
          | Database["public"]["Enums"]["supplier_regime"]
          | null
          total_purchases_value?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          categoria?: string | null
          city?: string | null
          cnpj?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          last_purchase_date?: string | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          postal_code?: string | null
          rating?: number | null
          state?: string | null
          street?: string | null
          supplier_type?:
          | Database["public"]["Enums"]["supplier_tipo"]
          | null
          tax_regime?:
          | Database["public"]["Enums"]["supplier_regime"]
          | null
          total_purchases_value?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      ncm_rules: {
        Row: {
          active: boolean | null
          aliquota_icms: number | null
          aliquota_ipi: number | null
          aliquota_pis_cofins: number | null
          created_at: string | null
          cst_pis_cofins: string | null
          descricao: string | null
          id: string
          ncm: string
          tipo_mercadoria: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          aliquota_icms?: number | null
          aliquota_ipi?: number | null
          aliquota_pis_cofins?: number | null
          created_at?: string | null
          cst_pis_cofins?: string | null
          descricao?: string | null
          id?: string
          ncm: string
          tipo_mercadoria?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          aliquota_icms?: number | null
          aliquota_ipi?: number | null
          aliquota_pis_cofins?: number | null
          created_at?: string | null
          cst_pis_cofins?: string | null
          descricao?: string | null
          id?: string
          ncm?: string
          tipo_mercadoria?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ofertas_fornecedor: {
        Row: {
          cotacao_id: string | null
          created_at: string | null
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          preco_unitario: number | null
          produto_id: string | null
          quantidade: number | null
          status: string | null
        }
        Insert: {
          cotacao_id?: string | null
          created_at?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          preco_unitario?: number | null
          produto_id?: string | null
          quantidade?: number | null
          status?: string | null
        }
        Update: {
          cotacao_id?: string | null
          created_at?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          preco_unitario?: number | null
          produto_id?: string | null
          quantidade?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_fornecedor_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
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
          active: boolean | null
          category: string | null
          code: string
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: string
          last_purchase_date: string | null
          last_purchase_price: number | null
          min_stock: number | null
          name: string
          ncm: string | null
          sale_price: number | null
          stock_quantity: number | null
          unit: Database["public"]["Enums"]["unit_type"]
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          code: string
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          min_stock?: number | null
          name: string
          ncm?: string | null
          sale_price?: number | null
          stock_quantity?: number | null
          unit?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          code?: string
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          min_stock?: number | null
          name?: string
          ncm?: string | null
          sale_price?: number | null
          stock_quantity?: number | null
          unit?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string | null
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
          categoria: string | null
          created_at: string | null
          data: string
          descricao: string
          id: string
          status: string | null
          tipo: string | null
          user_id: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          data: string
          descricao: string
          id?: string
          status?: string | null
          tipo?: string | null
          user_id?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          data?: string
          descricao?: string
          id?: string
          status?: string | null
          tipo?: string | null
          user_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      regras_ncm: {
        Row: {
          active: boolean | null
          aliquota_icms: number | null
          aliquota_ipi: number | null
          aliquota_pis_cofins: number | null
          created_at: string | null
          cst_pis_cofins: string | null
          descricao: string | null
          id: string
          ncm: string
          tipo_mercadoria: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          aliquota_icms?: number | null
          aliquota_ipi?: number | null
          aliquota_pis_cofins?: number | null
          created_at?: string | null
          cst_pis_cofins?: string | null
          descricao?: string | null
          id?: string
          ncm: string
          tipo_mercadoria?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          aliquota_icms?: number | null
          aliquota_ipi?: number | null
          aliquota_pis_cofins?: number | null
          created_at?: string | null
          cst_pis_cofins?: string | null
          descricao?: string | null
          id?: string
          ncm: string
          tipo_mercadoria?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_simulations: {
        Row: {
          created_at: string
          id: string
          is_mobile: boolean | null
          profile: Json
          results: Json
          scenario_name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_mobile?: boolean | null
          profile: Json
          results: Json
          scenario_name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_mobile?: boolean | null
          profile?: Json
          results?: Json
          scenario_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      unidades_conversao: {
        Row: {
          created_at: string | null
          fator: number
          from_unit: Database["public"]["Enums"]["unit_type"]
          id: string
          produto_id: string | null
          to_unit: Database["public"]["Enums"]["unit_type"]
        }
        Insert: {
          created_at?: string | null
          fator: number
          from_unit: Database["public"]["Enums"]["unit_type"]
          id?: string
          produto_id?: string | null
          to_unit: Database["public"]["Enums"]["unit_type"]
        }
        Update: {
          created_at?: string | null
          fator?: number
          from_unit?: Database["public"]["Enums"]["unit_type"]
          id?: string
          produto_id?: string | null
          to_unit?: Database["public"]["Enums"]["unit_type"]
        }
        Relationships: [
          {
            foreignKeyName: "unidades_conversao_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_yield: {
        Row: {
          created_at: string | null
          id: string
          ingrediente_id: string | null
          output_unit: Database["public"]["Enums"]["unit_type"]
          produto_final_id: string | null
          yield_percentage: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingrediente_id?: string | null
          output_unit: Database["public"]["Enums"]["unit_type"]
          produto_final_id?: string | null
          yield_percentage: number
        }
        Update: {
          created_at?: string | null
          id?: string
          ingrediente_id?: string | null
          output_unit: Database["public"]["Enums"]["unit_type"]
          produto_final_id?: string | null
          yield_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "unidades_yield_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_yield_produto_final_id_fkey"
            columns: ["produto_final_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
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
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never
