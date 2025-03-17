import React, { useState, useEffect } from "react";
import { apiRequest } from "../../utils/apiRequest";
import TournamentManagement from "./components/TournamentManagement/TournamentManagement.tsx";
import UserManagement from "./components/UserManagement/UserManagement.tsx";
import TrainersManagement
  from './components/TrainersManagement/TrainersManagement.tsx';
import styles from "./AdminPanel.module.scss";

interface Tournament {
  id: number;
  name: string;
  type: string;
  is_child: boolean;
  photo_path: string;
  organizer_name_and_contacts: string;
  organizer_requisites: string;
  date: string;
  price: number;
  can_register: boolean;
  address: string;
  prize_fund: number;
  owner_id: number;
  sex_id: number;
  category_id: number;
  region_id: number;
  description: string;
}

interface User {
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
  points?: number;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("tournaments");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Загрузка данных о текущем пользователе
  useEffect(() => {
    apiRequest("users/me", "GET", undefined, true)
      .then((data) => {
        if (data) {
          setCurrentUser(data);
        } else {
          setError("Ошибка загрузки данных пользователя");
        }
      })
      .catch(() => {
        setError("Ошибка загрузки данных пользователя");
        // Redirect to login if not authenticated
        window.location.href = "/login";
      });
  }, []);
  
  // Проверка на доступ к админ-панели
  useEffect(() => {
    if (currentUser && !currentUser.admin && !currentUser.organizer) {
      // Redirect if not admin or organizer
      window.location.href = "/";
    }
  }, [currentUser]);
  
  // Загрузка данных
  useEffect(() => {
    if (currentUser) {
      if (activeTab === "tournaments") {
        loadTournaments();
      } else if (activeTab === "users") {
        loadUsers();
      }
    }
  }, [activeTab, currentUser]);
  
  const loadTournaments = () => {
    setLoading(true);
    apiRequest("tournaments", "GET", undefined, true)
      .then((data) => {
        if (data) {
          setTournaments(data);
        } else {
          setError("Ошибка загрузки турниров");
        }
      })
      .catch(() => setError("Ошибка загрузки турниров"))
      .finally(() => setLoading(false));
  };
  
  const loadUsers = () => {
    if (!currentUser?.admin) {
      setError("Доступ запрещен");
      setActiveTab("tournaments");
      return;
    }
    
    setLoading(true);
    apiRequest("users", "GET", undefined, true)
      .then((data) => {
        if (data) {
          setUsers(data);
        } else {
          setError("Ошибка загрузки пользователей");
        }
      })
      .catch(() => setError("Ошибка загрузки пользователей"))
      .finally(() => setLoading(false));
  };
  
  // Обработчики ошибок и обновления данных
  const handleErrorMessage = (message: string) => {
    setError(message);
  };
  
  const handleLogout = () => {
    // Очистка токена и редирект на главную страницу
    localStorage.removeItem("authToken");
    window.location.href = "/";
  };
  
  if (!currentUser) {
    return <div className={styles.loading}>Загрузка...</div>;
  }
  
  if (loading && tournaments.length === 0 && users.length === 0) {
    return <div className={styles.loading}>Загрузка...</div>;
  }
  
  if (!currentUser.admin && !currentUser.organizer) {
    return <div className={styles.error}>У вас нет доступа к этой странице</div>;
  }
  
  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Панель администратора</h1>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Выход
        </button>
      </div>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === "tournaments" ? styles.active : ""}`}
          onClick={() => setActiveTab("tournaments")}
        >
          Управление турнирами
        </button>
        {currentUser.admin && (
          <button
            className={`${styles.tabButton} ${activeTab === "users" ? styles.active : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Управление пользователями
          </button>
        )}
        
        {currentUser.admin && (
          <button
            className={`${styles.tabButton} ${activeTab === "trainers" ? styles.active : ""}`}
            onClick={() => setActiveTab("trainers")}
          >
            Управление тренерами
          </button>
        )}
      </div>
      
      {activeTab === "tournaments" && (
        <TournamentManagement
          currentUser={currentUser}
          onTournamentsUpdate={(updateFn) => setTournaments(updateFn)}
          onError={handleErrorMessage}
        />
      )}
      
      {activeTab === "users" && currentUser.admin && (
        <UserManagement
          currentUser={currentUser}
          onError={handleErrorMessage}
        />
      )}
      
      {activeTab === "trainers" && currentUser.admin && (
        <TrainersManagement
          onError={handleErrorMessage}
        />
      )}
    </div>
  );
};

export default AdminPanel;
