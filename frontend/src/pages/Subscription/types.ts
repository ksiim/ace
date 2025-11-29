export interface PlanFeature {
  text: string;
}

export interface SubscriptionPlan {
  type: string;
  period: string;
  features: PlanFeature[];
  price: number | null;
  discount: number;
  monthlyPrice: number;
  isFirst?: boolean;
  rawPrice?: number;
  isRecommended?: boolean;
}

export interface Transaction {
  amount: number;
  payment_link: string;
  operation_id: string;
  months: number;
  status: string;
  created_at: string;
  updated_at: string;
  id: number;
  user_id: number;
}

export interface PlanCardProps {
  type: string;
  period: string;
  features: PlanFeature[];
  price: number | null;
  discount: number;
  monthlyPrice: number;
  isFirst?: boolean;
  rawPrice?: number;
  isRecommended?: boolean;
}

export interface SubscriptionBannerProps {
  scrollToOptions: () => void;
}

export interface BenefitItem {
  title: string;
  description: string;
}
