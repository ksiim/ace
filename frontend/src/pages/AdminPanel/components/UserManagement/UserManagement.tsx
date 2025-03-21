import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../../../utils/apiRequest';
import styles from '../../AdminPanel.module.scss';
import type { UserManagementProps, UserToManage } from '../../types.ts';

type UserRole = "Администратор" | "Организатор" | "Пользователь";

const UserManagement: React.FC<UserManagementProps> = ({
                                                         currentUser,
                                                         onError,
                                                       }) => {
  const [users, setUsers] = useState<UserToManage[]>([]);
  const [skip, setSkip] = useState<number>(0);
  const [limit] = useState<number>(10);
  const [subscriptionFilter, setSubscriptionFilter] = useState<boolean | null>(null);
  const [sortByPoints, setSortByPoints] = useState<"asc" | "desc" | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [fioFilter, setFioFilter] = useState<string>("");
  const [ageOrder, setAgeOrder] = useState<"asc" | "desc" | null>(null);
  const [sexFilter, setSexFilter] = useState<number | null>(null);
  const [sexOptions, setSexOptions] = useState<{ id: number; name: string }[]>([]);
  
  const [editUserData, setEditUserData] = useState<{
    userId: number | null;
    points: number | null;
    editingRole: boolean;
    role: UserRole | null;
  }>({
    userId: null,
    points: null,
    editingRole: false,
    role: null,
  });
  
  // Загрузка данных о полах
  useEffect(() => {
    const fetchSexOptions = async () => {
      try {
        const sexResponse = await apiRequest('sex/', 'GET', undefined, true);
        if (sexResponse && sexResponse.data) {
          setSexOptions(sexResponse.data.filter((sex: { shortname: string }) => sex.shortname !== 'mixed'));
        }
      } catch (error) {
        onError("Ошибка при загрузке данных о полах");
      }
    };
    
    fetchSexOptions();
  }, []);
  
  // Функция для сброса всех фильтров
  const resetFilters = () => {
    setSubscriptionFilter(null);
    setRoleFilter("");
    setFioFilter("");
    setAgeOrder(null);
    setSortByPoints(null);
    setSexFilter(null);
  };
  
  // Загрузка данных пользователей с фильтрами и сортировкой
  useEffect(() => {
    const fetchUsers = async () => {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        ...(roleFilter && {
          is_admin: (roleFilter === "Администратор").toString(),
          is_organizer: (roleFilter === "Организатор").toString(),
        }),
        ...(sortByPoints && { score_order: sortByPoints }),
        ...(fioFilter && { fio: fioFilter }),
        ...(ageOrder && { age_order: ageOrder }),
        ...(sexFilter !== null && { sex_id: sexFilter.toString() }),
      }).toString();
      
      const response = await apiRequest(`users/?${params}`, "GET", undefined, true);
      if (response && response.data) {
        setUsers(response.data);
      } else {
        onError("Ошибка при загрузке пользователей");
      }
    };
    
    fetchUsers();
  }, [skip, limit, roleFilter, sortByPoints, fioFilter, ageOrder, sexFilter]);
  
  const getUserRole = (user: UserToManage): UserRole => {
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
  
  const filteredUsers = users.filter((user) => {
    // Фильтр по подписке
    return subscriptionFilter === null ||
      (subscriptionFilter
        ? user.end_of_subscription && new Date(user.end_of_subscription).getTime() !== 0
        : !user.end_of_subscription || new Date(user.end_of_subscription).getTime() === 0);
  });
  
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortByPoints === "asc") {
      return (a.score || 0) - (b.score || 0);
    } else if (sortByPoints === "desc") {
      return (b.score || 0) - (a.score || 0);
    } else {
      return 0; // Без сортировки
    }
  });
  
  const handleSortByPoints = () => {
    if (sortByPoints === null) {
      setSortByPoints("asc");
    } else if (sortByPoints === "asc") {
      setSortByPoints("desc");
    } else {
      setSortByPoints(null);
    }
  };
  
  const handleUpdateUserPoints = (userId: number, points: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      onError("Пользователь не найден");
      return;
    }
    
    apiRequest(
      `users/${userId}`,
      "PUT",
      {
        name: user.name,
        surname: user.surname,
        patronymic: user.patronymic,
        admin: user.admin,
        organizer: user.organizer,
        phone_number: user.phone_number,
        email: user.email,
        score: points,
        end_of_subscription: user.end_of_subscription,
        updated_at: new Date().toISOString(),
        created_at: user.created_at,
        birth_date: user.birth_date,
        sex_id: user.sex_id,
      },
      true
    )
      .then((data) => {
        if (data) {
          setUsers((prevUsers) =>
            prevUsers.map((u) => (u.id === userId ? { ...u, score: data.score } : u))
          );
          setEditUserData({
            userId: null,
            points: null,
            editingRole: false,
            role: null,
          });
        } else {
          onError("Ошибка обновления очков пользователя");
        }
      })
      .catch(() => onError("Ошибка обновления очков пользователя"));
  };
  
  const handleUpdateUserRole = (userId: number, role: UserRole) => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      onError("Пользователь не найден");
      return;
    }
    
    const roleValues = getRoleValues(role);
    
    apiRequest(
      `users/${userId}`,
      "PUT",
      {
        name: user.name,
        surname: user.surname,
        patronymic: user.patronymic,
        admin: roleValues.admin,
        organizer: roleValues.organizer,
        phone_number: user.phone_number,
        email: user.email,
        score: user.score || 0,
        end_of_subscription: user.end_of_subscription,
        updated_at: new Date().toISOString(),
        created_at: user.created_at,
        birth_date: user.birth_date,
        sex_id: user.sex_id,
      },
      true
    )
      .then((data) => {
        if (data) {
          setUsers((prevUsers) =>
            prevUsers.map((u) =>
              u.id === userId
                ? {
                  ...u,
                  admin: roleValues.admin,
                  organizer: roleValues.organizer,
                }
                : u
            )
          );
          setEditUserData({
            userId: null,
            points: null,
            editingRole: false,
            role: null,
          });
        } else {
          onError("Ошибка обновления роли пользователя");
        }
      })
      .catch(() => onError("Ошибка обновления роли пользователя"));
  };
  
  const handleEditRole = (user: UserToManage) => {
    setEditUserData({
      userId: user.id,
      points: null,
      editingRole: true,
      role: getUserRole(user),
    });
  };
  
  const handleEditPoints = (user: UserToManage) => {
    setEditUserData({
      userId: user.id,
      points: user.score || 0,
      editingRole: false,
      role: null,
    });
  };
  
  const handleCancelEdit = () => {
    setEditUserData({
      userId: null,
      points: null,
      editingRole: false,
      role: null,
    });
  };
  
  return (
    <div className={styles.tabContent}>
      <div className={styles.filters}>
        {/* Фильтр по подписке */}
        <select
          value={subscriptionFilter === null ? "" : subscriptionFilter ? "active" : "inactive"}
          onChange={(e) => {
            const value = e.target.value;
            setSubscriptionFilter(value === "" ? null : value === "active");
          }}
          className={styles.filterSelect}
        >
          <option value="">Все подписки</option>
          <option value="active">С активной подпиской</option>
          <option value="inactive">Без активной подписки</option>
        </select>
        
        {/* Фильтр по роли */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
          className={styles.filterSelect}
        >
          <option value="">Все роли</option>
          <option value="Администратор">Администратор</option>
          <option value="Организатор">Организатор</option>
          <option value="Пользователь">Пользователь</option>
        </select>
        
        {/* Фильтр по ФИО */}
        <input
          type="text"
          placeholder="Фильтр по ФИО"
          value={fioFilter}
          onChange={(e) => setFioFilter(e.target.value)}
          className={styles.filterInput}
        />
        
        {/* Фильтр по полу */}
        <select
          value={sexFilter || ""}
          onChange={(e) => setSexFilter(e.target.value ? parseInt(e.target.value) : null)}
          className={styles.filterSelect}
        >
          <option value="">Все полы</option>
          {sexOptions.map((sex) => (
            <option key={sex.id} value={sex.id}>{sex.name}</option>
          ))}
        </select>
        
        {/* Сортировка по возрасту */}
        <select
          value={ageOrder || ""}
          onChange={(e) => setAgeOrder(e.target.value as "asc" | "desc" | null)}
          className={styles.filterSelect}
        >
          <option value="">Сортировка по возрасту</option>
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </select>
        
        {/* Кнопка сброса фильтров */}
        <button
          onClick={resetFilters}
          className={styles.resetButton}
        >
          Сбросить фильтры
        </button>
      </div>
      
      <div className={styles.tableContainer}>
        <h2>Список пользователей</h2>
        {sortedUsers.length > 0 ? (
          <table className={styles.dataTable}>
            <thead>
            <tr>
              <th>ID</th>
              <th>ФИО</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Роль</th>
              <th>Подписка до</th>
              <th onClick={handleSortByPoints} className={styles.sortableHeader}
                  style={{cursor: "pointer"}}>
                Очки{" "}
                {sortByPoints === "asc" && "↑"}
                {sortByPoints === "desc" && "↓"}
                {sortByPoints === null && "↕"}
              </th>
              <th>Действия</th>
            </tr>
            </thead>
            <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{`${user.surname} ${user.name} ${user.patronymic}`}</td>
                <td>{user.email}</td>
                <td>{user.phone_number}</td>
                <td>
                  {editUserData.userId === user.id && editUserData.editingRole ? (
                    <select
                      value={editUserData.role || getUserRole(user)}
                      onChange={(e) =>
                        setEditUserData({
                          ...editUserData,
                          role: e.target.value as UserRole,
                        })
                      }
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
                <td>
                  {user.end_of_subscription &&
                  new Date(user.end_of_subscription).getTime() !== 0
                    ? new Date(user.end_of_subscription).toLocaleDateString()
                    : " "}
                </td>
                <td>
                  {editUserData.userId === user.id && !editUserData.editingRole ? (
                    <input
                      type="number"
                      value={editUserData.points === null ? '' : editUserData.points.toString()}
                      onChange={(e) => {
                        const value = e.target.value;
                        const trimmedValue = value.replace(/^0+/, '') || '0';
                        setEditUserData({
                          ...editUserData,
                          points: trimmedValue === '' ? null : parseInt(trimmedValue, 10),
                        });
                      }}
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
      
      <div className={styles.pagination}>
        <button
          onClick={() => setSkip(Math.max(skip - limit, 0))}
          disabled={skip === 0}
        >
          Назад
        </button>
        <button onClick={() => setSkip(skip + limit)}>Вперёд</button>
      </div>
    </div>
  );
};

export default UserManagement;
