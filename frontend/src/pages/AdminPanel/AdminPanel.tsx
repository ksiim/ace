import React, { useState, useEffect } from "react";
import { apiRequest } from "../../utils/apiRequest";
import styles from "./AdminPanel.module.scss";

interface Tournament {
  id: number;
  name: string;
  date: string;
  location: string;
  status: string;
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
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
  
  // Состояния для форм
  const [newTournament, setNewTournament] = useState<Partial<Tournament>>({
    name: "",
    date: "",
    location: "",
    status: "upcoming",
    description: ""
  });
  
  const [editTournamentId, setEditTournamentId] = useState<number | null>(null);
  const [editUserData, setEditUserData] = useState<{userId: number | null, points: number | null}>({
    userId: null,
    points: null
  });
  
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
  
  // Обработчики форм
  const handleTournamentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTournament(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    
    apiRequest("tournaments", "POST", newTournament, true)
      .then((data) => {
        if (data) {
          setTournaments(prev => [...prev, data]);
          setNewTournament({
            name: "",
            date: "",
            location: "",
            status: "upcoming",
            description: ""
          });
        } else {
          setError("Ошибка создания турнира");
        }
      })
      .catch(() => setError("Ошибка создания турнира"));
  };
  
  const handleUpdateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editTournamentId) return;
    
    apiRequest(`tournaments/${editTournamentId}`, "PUT", newTournament, true)
      .then((data) => {
        if (data) {
          setTournaments(prev =>
            prev.map(t => t.id === editTournamentId ? {...t, ...data} : t)
          );
          setEditTournamentId(null);
          setNewTournament({
            name: "",
            date: "",
            location: "",
            status: "upcoming",
            description: ""
          });
        } else {
          setError("Ошибка обновления турнира");
        }
      })
      .catch(() => setError("Ошибка обновления турнира"));
  };
  
  const handleDeleteTournament = (id: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот турнир?")) return;
    
    apiRequest(`tournaments/${id}`, "DELETE", undefined, true)
      .then((success) => {
        if (success) {
          setTournaments(prev => prev.filter(t => t.id !== id));
        } else {
          setError("Ошибка удаления турнира");
        }
      })
      .catch(() => setError("Ошибка удаления турнира"));
  };
  
  const startEditTournament = (tournament: Tournament) => {
    setEditTournamentId(tournament.id);
    setNewTournament({
      name: tournament.name,
      date: tournament.date,
      location: tournament.location,
      status: tournament.status,
      description: tournament.description
    });
  };
  
  const cancelEdit = () => {
    setEditTournamentId(null);
    setNewTournament({
      name: "",
      date: "",
      location: "",
      status: "upcoming",
      description: ""
    });
  };
  
  const handleUpdateUserPoints = (userId: number, points: number) => {
    apiRequest(`users/${userId}`, "PUT", { points }, true)
      .then((data) => {
        if (data) {
          setUsers(prev =>
            prev.map(u => u.id === userId ? {...u, points: data.points} : u)
          );
          setEditUserData({ userId: null, points: null });
        } else {
          setError("Ошибка обновления очков пользователя");
        }
      })
      .catch(() => setError("Ошибка обновления очков пользователя"));
  };
  
  // Проверка доступа к редактированию
  const canEditTournament = (tournament: Tournament) => {
    if (!currentUser) return false;
    return currentUser.admin || (currentUser.organizer && tournament.created_by === currentUser.id);
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
      <h1 className={styles.title}>Панель администратора</h1>
      
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
      </div>
      
      {activeTab === "tournaments" && (
        <div className={styles.tabContent}>
          <div className={styles.formContainer}>
            <h2>{editTournamentId ? "Редактировать турнир" : "Добавить новый турнир"}</h2>
            <form onSubmit={editTournamentId ? handleUpdateTournament : handleCreateTournament}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Название турнира</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newTournament.name}
                  onChange={handleTournamentInputChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="date">Дата проведения</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={newTournament.date}
                  onChange={handleTournamentInputChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="location">Место проведения</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newTournament.location}
                  onChange={handleTournamentInputChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="status">Статус</label>
                <select
                  id="status"
                  name="status"
                  value={newTournament.status}
                  onChange={handleTournamentInputChange}
                >
                  <option value="upcoming">Предстоящий</option>
                  <option value="ongoing">В процессе</option>
                  <option value="completed">Завершён</option>
                  <option value="cancelled">Отменён</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="description">Описание</label>
                <textarea
                  id="description"
                  name="description"
                  value={newTournament.description}
                  onChange={handleTournamentInputChange}
                  rows={4}
                ></textarea>
              </div>
              
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  {editTournamentId ? "Обновить турнир" : "Создать турнир"}
                </button>
                
                {editTournamentId && (
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={cancelEdit}
                  >
                    Отменить
                  </button>
                )}
              </div>
            </form>
          </div>
          
          <div className={styles.tableContainer}>
            <h2>Список турниров</h2>
            {tournaments.length > 0 ? (
              <table className={styles.dataTable}>
                <thead>
                <tr>
                  <th>ID</th>
                  <th>Название</th>
                  <th>Дата</th>
                  <th>Место</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
                </thead>
                <tbody>
                {tournaments.map((tournament) => (
                  <tr key={tournament.id}>
                    <td>{tournament.id}</td>
                    <td>{tournament.name}</td>
                    <td>{new Date(tournament.date).toLocaleDateString()}</td>
                    <td>{tournament.location}</td>
                    <td>
                        <span className={`${styles.status} ${styles[tournament.status]}`}>
                          {tournament.status === "upcoming" && "Предстоящий"}
                          {tournament.status === "ongoing" && "В процессе"}
                          {tournament.status === "completed" && "Завершён"}
                          {tournament.status === "cancelled" && "Отменён"}
                        </span>
                    </td>
                    <td>
                      {canEditTournament(tournament) && (
                        <div className={styles.actionButtons}>
                          <button
                            className={styles.editButton}
                            onClick={() => startEditTournament(tournament)}
                          >
                            Редактировать
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteTournament(tournament.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noData}>Турниры не найдены</p>
            )}
          </div>
        </div>
      )}
      
      {activeTab === "users" && currentUser.admin && (
        <div className={styles.tabContent}>
          <div className={styles.tableContainer}>
            <h2>Список пользователей</h2>
            {users.length > 0 ? (
              <table className={styles.dataTable}>
                <thead>
                <tr>
                  <th>ID</th>
                  <th>ФИО</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Роль</th>
                  <th>Подписка до</th>
                  <th>Очки</th>
                  <th>Действия</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{`${user.surname} ${user.name} ${user.patronymic}`}</td>
                    <td>{user.email}</td>
                    <td>{user.phone_number}</td>
                    <td>
                      {user.admin
                        ? "Администратор"
                        : user.organizer
                          ? "Организатор"
                          : "Пользователь"}
                    </td>
                    <td>{new Date(user.end_of_subscription).toLocaleDateString()}</td>
                    <td>
                      {editUserData.userId === user.id ? (
                        <input
                          type="number"
                          value={editUserData.points || 0}
                          onChange={(e) => setEditUserData({
                            ...editUserData,
                            points: parseInt(e.target.value)
                          })}
                          className={styles.pointsInput}
                        />
                      ) : (
                        user.points || 0
                      )}
                    </td>
                    <td>
                      {currentUser.admin && (
                        <div className={styles.actionButtons}>
                          {editUserData.userId === user.id ? (
                            <>
                              <button
                                className={styles.saveButton}
                                onClick={() => handleUpdateUserPoints(
                                  user.id,
                                  editUserData.points || 0
                                )}
                              >
                                Сохранить
                              </button>
                              <button
                                className={styles.cancelButton}
                                onClick={() => setEditUserData({userId: null, points: null})}
                              >
                                Отменить
                              </button>
                            </>
                          ) : (
                            <button
                              className={styles.editButton}
                              onClick={() => setEditUserData({
                                userId: user.id,
                                points: user.points || 0
                              })}
                            >
                              Изменить очки
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                </tbody>
              </table>
            ) : (
              <p className={styles.noData}>Пользователи не найдены</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
