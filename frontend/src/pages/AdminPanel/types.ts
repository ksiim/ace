export interface Tournament {
  id: number;
  name: string;
  type: string;
  is_child: boolean;
  photo_path: string;
  organizer_name_and_contacts: string;
  organizer_requisites: string;
  description: string;
  date: string;
  price: number;
  can_register: boolean;
  address: string;
  prize_fund: string;
  owner_id: number;
  sex_id: number;
  category_id: number;
  region_id: number;
  comment: string;
}

export interface Participant {
  id: number;
  confirmed: boolean;
  user_id: number;
  partner_id: number | null;
  participant_name: string;
  tournament_id: number;
}

export interface Fio {
  name: string;
  surname: string;
  patronymic: string;
}

export interface User {
  id: number;
  admin: boolean;
  organizer: boolean;
}

export interface Category {
  id: number;
  name: string;
  is_child: boolean;
}

export interface Region {
  id: number;
  name: string;
}

export interface Sex {
  id: number;
  name: string;
  shortname: string;
}

export interface TournamentManagementProps {
  currentUser: User;
  onTournamentsUpdate: (updateFn: (prevTournaments: Tournament[]) => Tournament[]) => void;
  onError: (error: string) => void;
}

export interface UserToManage {
  id: number,
  name: string;
  surname: string;
  patronymic: string;
  score: number;
  admin: boolean;
  telegram_id: number;
  organizer: boolean;
  end_of_subscription: string;
  updated_at: string;
  created_at: string;
  phone_number: string;
  email: string;
  birth_date: string;
  sex_id: number;
  region_id: number;
}

export interface UserManagementProps {
  currentUser: UserToManage;
  onError: (error: string) => void;
}

export interface Region {
  id: number;
  name: string;
}

export interface Trainer {
  id: number;
  name: string;
  photo_path: string;
  description: string;
  phone: string;
  address: string;
  region_id: number;
}

export interface TrainerManagementProps {
  onError: (error: string) => void;
}
