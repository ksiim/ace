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
  const [regionFilter, setRegionFilter] = useState<number | null>(null);
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  
  const [editUserData, setEditUserData] = useState<{
    userId: number | null;
    points: number | null;
    editingRole: boolean;
    role: UserRole | null;
    editingInfo: boolean;
    name: string | null;
    surname: string | null;
    patronymic: string | null;
    birth_date: string | null;
  }>({
    userId: null,
    points: null,
    editingRole: false,
    role: null,
    editingInfo: false,
    name: null,
    surname: null,
    patronymic: null,
    birth_date: null,
  });

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

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const response = await apiRequest('regions/', 'GET', undefined, true);
        if (response && response.data) {
          setRegions(response.data);
        }
      } catch (error) {
        onError("Ошибка при загрузке регионов");
      }
    };
    
    fetchRegions();
  }, []);

  const resetFilters = () => {
    setSubscriptionFilter(null);
    setRoleFilter("");
    setFioFilter("");
    setAgeOrder(null);
    setSortByPoints(null);
    setSexFilter(null);
    setRegionFilter(null);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        ...(roleFilter && {
          is_admin: (roleFilter === "Администратор").toString(),
          is_organizer: (roleFilter === "Организатор").toString(),
        }),
        ...(subscriptionFilter && { is_subscriber: subscriptionFilter.toString()}),
        ...(sortByPoints && { score_order: sortByPoints }), // Сортировка по очкам на сервере
        ...(fioFilter && { fio: fioFilter }),
        ...(ageOrder && { age_order: ageOrder }),
        ...(sexFilter !== null && { sex_id: sexFilter.toString() }),
        ...(regionFilter !== null && { region_id: regionFilter.toString() }),
      }).toString();
      
      const response = await apiRequest(`users/?${params}`, "GET", undefined, true);
      if (response && response.data) {
        setUsers(response.data);
      } else {
        onError("Ошибка при загрузке пользователей");
      }
    };
    
    fetchUsers();
  }, [skip, limit, roleFilter, sortByPoints, fioFilter, ageOrder, sexFilter, regionFilter, subscriptionFilter]);
  
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
  
  // Сортировка по возрасту на клиенте
  const sortedUsers = [...users].sort((a, b) => {
    if (ageOrder === "asc") {
      const ageA = new Date(a.birth_date).getTime();
      const ageB = new Date(b.birth_date).getTime();
      return ageA - ageB;
    } else if (ageOrder === "desc") {
      const ageA = new Date(a.birth_date).getTime();
      const ageB = new Date(b.birth_date).getTime();
      return ageB - ageA;
    } else {
      return 0;
    }
  });

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
        region_id: user.region_id,
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
            editingInfo: false,
            name: null,
            surname: null,
            patronymic: null,
            birth_date: null,
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
        region_id: user.region_id,
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
            editingInfo: false,
            name: null,
            surname: null,
            patronymic: null,
            birth_date: null,
          });
        } else {
          onError("Ошибка обновления роли пользователя");
        }
      })
      .catch(() => onError("Ошибка обновления роли пользователя"));
  };

  const handleUpdateUserInfo = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      onError("Пользователь не найден");
      return;
    }

    apiRequest(
      `users/${userId}`,
      "PUT",
      {
        name: editUserData.name || user.name,
        surname: editUserData.surname || user.surname,
        patronymic: editUserData.patronymic || user.patronymic,
        admin: user.admin,
        organizer: user.organizer,
        phone_number: user.phone_number,
        email: user.email,
        score: user.score || 0,
        end_of_subscription: user.end_of_subscription,
        updated_at: new Date().toISOString(),
        created_at: user.created_at,
        birth_date: editUserData.birth_date || user.birth_date,
        sex_id: user.sex_id,
        region_id: user.region_id,
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
                    name: data.name,
                    surname: data.surname,
                    patronymic: data.patronymic,
                    birth_date: data.birth_date,
                  }
                : u
            )
          );
          setEditUserData({
            userId: null,
            points: null,
            editingRole: false,
            role: null,
            editingInfo: false,
            name: null,
            surname: null,
            patronymic: null,
            birth_date: null,
          });
        } else {
          onError("Ошибка обновления информации пользователя");
        }
      })
      .catch(() => onError("Ошибка обновления информации пользователя"));
  };

  const handleEditRole = (user: UserToManage) => {
    setEditUserData({
      userId: user.id,
      points: null,
      editingRole: true,
      role: getUserRole(user),
      editingInfo: false,
      name: null,
      surname: null,
      patronymic: null,
      birth_date: null,
    });
  };

  const handleEditPoints = (user: UserToManage) => {
    setEditUserData({
      userId: user.id,
      points: user.score || 0,
      editingRole: false,
      role: null,
      editingInfo: false,
      name: null,
      surname: null,
      patronymic: null,
      birth_date: null,
    });
  };

  const handleEditInfo = (user: UserToManage) => {
    setEditUserData({
      userId: user.id,
      points: null,
      editingRole: false,
      role: null,
      editingInfo: true,
      name: user.name,
      surname: user.surname,
      patronymic: user.patronymic,
      birth_date: user.birth_date,
    });
  };

  const handleCancelEdit = () => {
    setEditUserData({
      userId: null,
      points: null,
      editingRole: false,
      role: null,
      editingInfo: false,
      name: null,
      surname: null,
      patronymic: null,
      birth_date: null,
    });
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Поиск по ФИО"
          value={fioFilter}
          onChange={(e) => setFioFilter(e.target.value)}
          className={styles.filterInput}
        />
        
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
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
          className={styles.filterSelect}
        >
          <option value="">Любая роль</option>
          <option value="Администратор">Администратор</option>
          <option value="Организатор">Организатор</option>
          <option value="Пользователь">Пользователь</option>
        </select>
        
        <select
          value={sexFilter || ""}
          onChange={(e) => setSexFilter(e.target.value ? parseInt(e.target.value) : null)}
          className={styles.filterSelect}
        >
          <option value="">Любой пол</option>
          {sexOptions.map((sex) => (
            <option key={sex.id} value={sex.id}>{sex.name}</option>
          ))}
        </select>
        
        <select
          value={regionFilter || ""}
          onChange={(e) => setRegionFilter(e.target.value ? parseInt(e.target.value) : null)}
          className={styles.filterSelect}
        >
          <option value="">Любой регион</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>{region.name}</option>
          ))}
        </select>
        
        <select
          value={ageOrder || ""}
          onChange={(e) => setAgeOrder(e.target.value as "asc" | "desc" | null)}
          className={styles.filterSelect}
        >
          <option value="">Сортировка по возрасту</option>
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </select>
        
        <select
          value={sortByPoints || ""}
          onChange={(e) => setSortByPoints(e.target.value as "asc" | "desc" | null)}
          className={styles.filterSelect}
        >
          <option value="">Сортировка по очкам</option>
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </select>
        
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
              <th className={styles.birthDateColumn}>Дата рождения</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Роль</th>
              <th>Подписка до</th>
              <th>Очки</th>
              <th>Действия</th>
            </tr>
            </thead>
            <tbody>
            {sortedUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>
                  {editUserData.userId === user.id && editUserData.editingInfo ? (
                    <div>
                      <input
                        type="text"
                        value={editUserData.surname || ""}
                        onChange={(e) => setEditUserData({ ...editUserData, surname: e.target.value })}
                        placeholder="Фамилия"
                        className={styles.pointsInput}
                      />
                      <input
                        type="text"
                        value={editUserData.name || ""}
                        onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                        placeholder="Имя"
                        className={styles.pointsInput}
                      />
                      <input
                        type="text"
                        value={editUserData.patronymic || ""}
                        onChange={(e) => setEditUserData({ ...editUserData, patronymic: e.target.value })}
                        placeholder="Отчество"
                        className={styles.pointsInput}
                      />
                    </div>
                  ) : (
                    `${user.surname} ${user.name} ${user.patronymic}`
                  )}
                </td>
                <td className={styles.birthDateColumn}>
                  {editUserData.userId === user.id && editUserData.editingInfo ? (
                    <input
                      type="date"
                      value={editUserData.birth_date || ""}
                      onChange={(e) => setEditUserData({ ...editUserData, birth_date: e.target.value })}
                      className={`${styles.pointsInput} ${styles.birthDateInput}`}
                    />
                  ) : (
                    user.birth_date ? new Date(user.birth_date).toLocaleDateString() : "Не указана"
                  )}
                </td>
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
                  {editUserData.userId === user.id && !editUserData.editingRole && !editUserData.editingInfo ? (
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
                              } else if (editUserData.editingInfo) {
                                handleUpdateUserInfo(user.id);
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
                          <button
                            className={styles.editButton}
                            onClick={() => handleEditInfo(user)}
                          >
                            Изменить информацию
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