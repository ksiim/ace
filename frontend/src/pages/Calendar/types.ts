export interface Tournament {
  id: number;
  date: string;
  name: string;
  address: string;
  organizer_name_and_contacts: string;
  type: 'solo' | 'duo';
  photo_path: string;
  organizer_requisites: string;
  description: string;
  price: number;
  can_register: boolean;
  prize_fund: string;
  owner_id: number;
  sex_id: number;
  category_id: number;
  region_id: number;
  comment: string;
}

export interface Region {
  id: number;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  is_child: boolean;
  from_age: number | null;
  to_age: number | null;
}
