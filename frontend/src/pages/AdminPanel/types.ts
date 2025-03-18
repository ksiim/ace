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
  prize_fund: number;
  owner_id: number;
  sex_id: number;
  category_id: number;
  region_id: number;
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
  id: number;
  name: string;
  surname: string;
  patronymic: string;
  admin: boolean;
  organizer: boolean;
  phone_number: string;
  email: string;
  end_of_subscription: string;
  created_at: string;
  updated_at: string;
  score?: number;
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
