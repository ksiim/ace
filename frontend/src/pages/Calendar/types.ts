export interface Tournament {
  id: number;
  date: string;
  name: string;
  address: string;
  organizer_name_and_contacts: string;
  type: string;
  photo_path: string;
  organizer_requisites: string;
  description: string;
  price: number;
  can_register: boolean;
  prize_fund: number;
  owner_id: number;
  sex_id: number;
  category_id: number;
  region_id: number;
}
