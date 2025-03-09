import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../../utils/apiRequest";
import styles from "../../AdminPanel.module.scss";

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
  score?: number;
}

interface UserManagementProps {
  currentUser: User;
  onError: (error: string) => void;
}

type UserRole = "Администратор" | "Организатор" | "Пользователь";

const UserManagement: React.FC<UserManagementProps> = ({
                                                         currentUser,
                                                         onError
                                                       }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editUserData, setEditUserData] = useState<{
    userId: number | null;
    points: number | null;
    editingRole: boolean;
    role: UserRole | null;
  }>({
    userId: null,
    points: null,
    editingRole: false,
    role: null
  });
  
  // Загрузка данных пользователей при монтировании компонента
  useEffect(() => {
    apiRequest("users/", "GET", undefined, true)
      .then((data) => {
        if (data && data.data) {
          setUsers(data.data); // Обновляем состояние с пользователями
        } else {
          onError("Ошибка при загрузке пользователей");
        }
      })
      .catch(() => onError("Ошибка при загрузке пользователей"));
  }, []);
  
  const getUserRole = (user: User): UserRole => {
    if (user.admin) return "Администратор";
    if (user.organizer) return "Организатор";
    return "Пользователь";
  };
  
  const getRoleValues = (role: UserRole): { admin: boolean; organizer: boolean } => {
    switch (role) {
      case "Администратор":
        return { admin: true, organizer: false };
      case "Организатор":
        return { admin: false, organizer: true };
      case "Пользователь":
      default:
        return { admin: false, organizer: false };
    }
  };
  
  const handleUpdateUserPoints = (userId: number, points: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      onError("Пользователь не найден");
      return;
    }
    
    apiRequest(`users/${userId}`, "PUT", {
      name: user.name,
      surname: user.surname,
      patronymic: user.patronymic,
      admin: user.admin,
      organizer: user.organizer,
      phone_number: user.phone_number,
      email: user.email,
      score: points,
      end_of_subscription: user.end_of_subscription,
      created_at: user.created_at,
      updated_at: new Date().toISOString()
    }, true)
      .then((data) => {
        if (data) {
          setUsers(prevUsers =>
            prevUsers.map(u => u.id === userId ? { ...u, score: data.score } : u)
          );
          setEditUserData({
            userId: null,
            points: null,
            editingRole: false,
            role: null
          });
        } else {
          onError("Ошибка обновления очков пользователя");
        }
      })
      .catch(() => onError("Ошибка обновления очков пользователя"));
  };
  
  const handleUpdateUserRole = (userId: number, role: UserRole) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      onError("Пользователь не найден");
      return;
    }
    
    const roleValues = getRoleValues(role);
    
    apiRequest(`users/${userId}`, "PUT", {
      name: user.name,
      surname: user.surname,
      patronymic: user.patronymic,
      admin: roleValues.admin,
      organizer: roleValues.organizer,
      phone_number: user.phone_number,
      email: user.email,
      score: user.score || 0,
      end_of_subscription: user.end_of_subscription,
      created_at: user.created_at,
      updated_at: new Date().toISOString()
    }, true)
      .then((data) => {
        if (data) {
          setUsers(prevUsers =>
            prevUsers.map(u => u.id === userId ? {
              ...u,
              admin: roleValues.admin,
              organizer: roleValues.organizer
            } : u)
          );
          setEditUserData({
            userId: null,
            points: null,
            editingRole: false,
            role: null
          });
        } else {
          onError("Ошибка обновления роли пользователя");
        }
      })
      .catch(() => onError("Ошибка обновления роли пользователя"));
  };
  
  const handleEditRole = (user: User) => {
    setEditUserData({
      userId: user.id,
      points: null,
      editingRole: true,
      role: getUserRole(user)
    });
  };
  
  const handleEditPoints = (user: User) => {
    setEditUserData({
      userId: user.id,
      points: user.score || 0,
      editingRole: false,
      role: null
    });
  };
  
  const handleCancelEdit = () => {
    setEditUserData({
      userId: null,
      points: null,
      editingRole: false,
      role: null
    });
  };
  
  return (
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
                  {editUserData.userId === user.id && editUserData.editingRole ? (
                    <select
                      value={editUserData.role || getUserRole(user)}
                      onChange={(e) => setEditUserData({
                        ...editUserData,
                        role: e.target.value as UserRole
                      })}
                      className={styles.roleSelect}
                    >
                      <option value="Администратор">Администратор</option>
                      <option value="Организатор">Организатор</option>
                      <option value="Пользователь">Пользователь</option>
                    </select>
                  ) : (
                    getUserRole(user)
                  )}
                </td>
                <td>{user.end_of_subscription && new Date(user.end_of_subscription).getTime() !== 0 ? new Date(user.end_of_subscription).toLocaleDateString() : ' '}</td>
                <td>
                  {editUserData.userId === user.id && !editUserData.editingRole ? (
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
                    user.score || 0
                  )}
                </td>
                <td>
                  {currentUser.admin && (
                    <div className={styles.actionButtons}>
                      {editUserData.userId === user.id ? (
                        <>
                          <button
                            className={styles.saveButton}
                            onClick={() => {
                              if (editUserData.editingRole && editUserData.role) {
                                handleUpdateUserRole(user.id, editUserData.role);
                              } else if (editUserData.points !== null) {
                                handleUpdateUserPoints(user.id, editUserData.points);
                              }
                            }}
                          >
                            Сохранить
                          </button>
                          <button
                            className={styles.cancelButton}
                            onClick={handleCancelEdit}
                          >
                            Отменить
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className={styles.editButton}
                            onClick={() => handleEditPoints(user)}
                          >
                            Изменить очки
                          </button>
                          <button
                            className={styles.editButton}
                            onClick={() => handleEditRole(user)}
                          >
                            Изменить роль
                          </button>
                        </>
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
  );
};

export default UserManagement;
