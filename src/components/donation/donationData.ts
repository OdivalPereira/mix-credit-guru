import { 
  Server,
  Zap,
  Sparkles,
  Database,
  Shield,
  Gauge,
  Heart,
  User,
  Coffee,
  Beer,
  Home,
  BookOpen,
  GraduationCap,
  Laptop,
  Wrench,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface DonationOption {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  amount: string;
  numericValue?: number;
}

// Doações para o PROJETO
export const projectDonationOptions: DonationOption[] = [
  {
    id: "hosting",
    title: "Hospedagem Mensal",
    description: "Ajude a manter o servidor no ar",
    icon: Server,
    amount: "R$ 20,00",
    numericValue: 20,
  },
  {
    id: "api-credits",
    title: "API Credits",
    description: "Contribua com custos de APIs externas",
    icon: Zap,
    amount: "R$ 30,00",
    numericValue: 30,
  },
  {
    id: "new-feature",
    title: "Nova Feature",
    description: "Financie o desenvolvimento de uma funcionalidade",
    icon: Sparkles,
    amount: "R$ 50,00",
    numericValue: 50,
  },
  {
    id: "database",
    title: "Banco de Dados",
    description: "Apoie a infraestrutura de dados",
    icon: Database,
    amount: "R$ 40,00",
    numericValue: 40,
  },
  {
    id: "security",
    title: "Segurança e SSL",
    description: "Invista em certificados e segurança",
    icon: Shield,
    amount: "R$ 25,00",
    numericValue: 25,
  },
  {
    id: "performance",
    title: "Performance",
    description: "Melhore velocidade e otimizações",
    icon: Gauge,
    amount: "R$ 60,00",
    numericValue: 60,
  },
  {
    id: "custom",
    title: "Valor Personalizado",
    description: "Escolha o valor que desejar",
    icon: Heart,
    amount: "Livre",
  },
];

// Card especial "Apoie o Desenvolvedor"
export const developerCardOption: DonationOption = {
  id: "developer-support",
  title: "❤️ Apoie o Desenvolvedor",
  description: "Doações diretas para o criador",
  icon: User,
  amount: "",
};

// Doações para o DESENVOLVEDOR
export const developerDonationOptions: DonationOption[] = [
  {
    id: "coffee",
    title: "Me pague um café",
    description: "Combustível para madrugadas de código",
    icon: Coffee,
    amount: "R$ 7,00",
    numericValue: 7,
  },
  {
    id: "beer",
    title: "Cerveja no final de semana",
    description: "Ajude a relaxar após uma sprint intensa",
    icon: Beer,
    amount: "R$ 12,00",
    numericValue: 12,
  },
  {
    id: "construction",
    title: "Material de construção",
    description: "Contribua para a casa própria",
    icon: Home,
    amount: "R$ 50,00",
    numericValue: 50,
  },
  {
    id: "book",
    title: "Livro técnico",
    description: "Invista no aprendizado contínuo",
    icon: BookOpen,
    amount: "R$ 35,00",
    numericValue: 35,
  },
  {
    id: "course",
    title: "Curso online",
    description: "Financie capacitação profissional",
    icon: GraduationCap,
    amount: "R$ 80,00",
    numericValue: 80,
  },
  {
    id: "equipment",
    title: "Upgrade de equipamento",
    description: "Ajude com melhor hardware",
    icon: Laptop,
    amount: "R$ 150,00",
    numericValue: 150,
  },
  {
    id: "tools",
    title: "Assinatura de ferramentas",
    description: "Pague softwares de desenvolvimento",
    icon: Wrench,
    amount: "R$ 45,00",
    numericValue: 45,
  },
  {
    id: "custom-dev",
    title: "Valor personalizado",
    description: "Escolha o valor que desejar",
    icon: Heart,
    amount: "Livre",
  },
];
