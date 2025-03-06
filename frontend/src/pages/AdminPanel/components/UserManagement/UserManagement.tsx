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
  points?: number;
}

interface UserManagementProps {
  currentUser: User;
  onError: (error: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
                                                         currentUser,
                                                         onError
                                                       }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [editUserData, setEditUserData] = useState<{ userId: number | null, points: number | null }>({
    userId: null,
    points: null
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
  
  const handleUpdateUserPoints = (userId: number, points: number) => {
    apiRequest(`users/${userId}`, "PUT", { points }, true)
      .then((data) => {
        if (data) {
          setUsers(prevUsers =>
            prevUsers.map(u => u.id === userId ? { ...u, points: data.points } : u)
          );
          setEditUserData({ userId: null, points: null });
        } else {
          onError("Ошибка обновления очков пользователя");
        }
      })
      .catch(() => onError("Ошибка обновления очков пользователя"));
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
                            onClick={() => setEditUserData({ userId: null, points: null })}
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
  );
};

export default UserManagement;
