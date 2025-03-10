import React, { useEffect, useState } from 'react';
import { apiRequest } from "../../../../utils/apiRequest.ts";
import styles from "../../AdminPanel.module.scss";

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
}

interface User {
  id: number;
  admin: boolean;
  organizer: boolean;
}

interface Category {
  id: number;
  name: string;
  is_child: boolean;
}

interface Region {
  id: number;
  name: string;
}

interface TournamentManagementProps {
  currentUser: User;
  onTournamentsUpdate: (updateFn: (prevTournaments: Tournament[]) => Tournament[]) => void;
  onError: (error: string) => void;
}

const TournamentManagement: React.FC<TournamentManagementProps> = ({
                                                                     currentUser,
                                                                     onTournamentsUpdate,
                                                                     onError
                                                                   }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [newTournament, setNewTournament] = useState<Partial<Tournament>>({
    name: "",
    type: "",
    is_child: false,
    photo_path: "",
    organizer_name_and_contacts: "",
    organizer_requisites: "",
    date: new Date().toISOString(),
    price: 0,
    can_register: true,
    address: "",
    prize_fund: 0,
    owner_id: currentUser.id,
    sex_id: 0,
    category_id: 0,
    region_id: 0
  });
  
  const [editTournamentId, setEditTournamentId] = useState<number | null>(null);
  
  useEffect(() => {
    apiRequest("tournaments/", "GET", undefined, true)
      .then((data) => {
        if (data && data.data) {
          setTournaments(data.data);
        } else {
          onError("Ошибка загрузки турниров");
        }
      })
      .catch(() => onError("Ошибка загрузки турниров"));
    
    apiRequest("categories/", "GET", undefined, true)
      .then((data) => {
        if (data && data.data) {
          setCategories(data.data);
        } else {
          onError("Ошибка загрузки категорий");
        }
      })
      .catch(() => onError("Ошибка загрузки категорий"));
    
    apiRequest("regions/", "GET", undefined, true)
      .then((data) => {
        if (data && data.data) {
          setRegions(data.data);
        } else {
          onError("Ошибка загрузки регионов");
        }
      })
      .catch(() => onError("Ошибка загрузки регионов"));
  }, []);
  
  const handleTournamentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setNewTournament(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) :
        type === 'checkbox' ? (e.target as HTMLInputElement).checked :
          value
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Проверка на изображение
      if (!file.type.startsWith("image/")) {
        onError("Загружать можно только изображения");
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      apiRequest("photos/", "POST", formData, true)
        .then((data) => {
          if (data && data.file_path) {
            // Изменяем путь
            const correctPath = `http://localhost${(data.file_path).slice(4)}`;
            setNewTournament(prev => ({
              ...prev,
              photo_path: correctPath // Сохраняем исправленный путь
            }));
          } else {
            onError("Ошибка загрузки фото");
          }
        })
        .catch(() => onError("Ошибка загрузки фото"));
    }
  };
  
  
  
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    apiRequest("tournaments/", "POST", newTournament, true)
      .then((data) => {
        if (data) {
          setTournaments(prevTournaments => [...prevTournaments, data]);
          onTournamentsUpdate(prevTournaments => {
            return Array.isArray(prevTournaments) ? [...prevTournaments, data] : [data];
          });
          
          setNewTournament({
            name: "",
            type: "",
            is_child: false,
            photo_path: "",
            organizer_name_and_contacts: "",
            organizer_requisites: "",
            date: new Date().toISOString(),
            price: 0,
            can_register: true,
            address: "",
            prize_fund: 0,
            owner_id: currentUser.id,
            sex_id: 0,
            category_id: 0,
            region_id: 0
          });
        } else {
          onError("Ошибка создания турнира");
        }
      })
      .catch((err) => {
        console.error("Create tournament error:", err);
        onError("Ошибка создания турнира");
      });
  };
  
  const cancelEdit = () => {
    setEditTournamentId(null);
    setNewTournament({
      name: "",
      type: "",
      is_child: false,
      photo_path: "",
      organizer_name_and_contacts: "",
      organizer_requisites: "",
      date: new Date().toISOString(),
      price: 0,
      can_register: true,
      address: "",
      prize_fund: 0,
      owner_id: currentUser.id,
      sex_id: 0,
      category_id: 0,
      region_id: 0
    });
  };
  
  const startEditTournament = (tournament: Tournament) => {
    setEditTournamentId(tournament.id);
    setNewTournament({...tournament});
  };
  
  const canEditTournament = (tournament: Tournament) => {
    if (!currentUser) return false;
    return currentUser.admin || (currentUser.organizer && tournament.owner_id === currentUser.id);
  };
  
  const handleUpdateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTournamentId) return;
    
    apiRequest(`tournaments/${editTournamentId}`, "PUT", newTournament, true)
      .then((data) => {
        if (data) {
          setTournaments(prevTournaments =>
            prevTournaments.map(t => t.id === editTournamentId ? { ...t, ...data } : t)
          );
          onTournamentsUpdate(prevTournaments => {
            return Array.isArray(prevTournaments)
              ? prevTournaments.map(t => t.id === editTournamentId ? { ...t, ...data } : t)
              : [data];
          });
          
          setEditTournamentId(null);
          setNewTournament({
            name: "",
            type: "",
            is_child: false,
            photo_path: "",
            organizer_name_and_contacts: "",
            organizer_requisites: "",
            date: new Date().toISOString(),
            price: 0,
            can_register: true,
            address: "",
            prize_fund: 0,
            owner_id: currentUser.id,
            sex_id: 0,
            category_id: 0,
            region_id: 0
          });
        } else {
          onError("Ошибка обновления турнира");
        }
      })
      .catch((err) => {
        console.error("Ошибка при обновлении турнира:", err);
        onError("Ошибка обновления турнира");
      });
  };
  
  
  const handleToggleRegistration = async (tournamentId: number, canRegister: boolean) => {
    try {
      // Find the tournament by ID
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) {
        onError("Турнир не найден");
        return;
      }
      
      // Create an updated tournament object with the opposite can_register value
      const updatedTournament = {
        ...tournament,
        can_register: !canRegister, // Toggle the registration status
      };
      
      // Send the PUT request with the updated tournament data
      const response = await apiRequest(
        `tournaments/${tournamentId}`,
        "PUT",
        updatedTournament,
        true
      );
      
      if (response) {
        // Update the tournaments state with the new can_register value
        setTournaments(prevTournaments =>
          prevTournaments.map(t =>
            t.id === tournamentId ? { ...t, can_register: !canRegister } : t
          )
        );
        
        // Update the parent component's tournaments state
        onTournamentsUpdate(prevTournaments => {
          // Check if prevTournaments is an array before mapping
          if (Array.isArray(prevTournaments)) {
            return prevTournaments.map(t =>
              t.id === tournamentId ? { ...t, can_register: !canRegister } : t
            );
          } else {
            // If it's not an array, return a new array with the updated tournament
            return [{ ...tournament, can_register: !canRegister }];
          }
        });
      } else {
        onError("Ошибка при изменении статуса регистрации");
      }
    } catch (err) {
      console.error("Ошибка при изменении статуса регистрации:", err);
      onError("Ошибка при изменении статуса регистрации");
    }
  };
  
  const handleSendMoneyRequest = async (tournamentId: number) => {
    try {
      const response = await apiRequest(
        `tournaments/${tournamentId}/send-money-request`,
        "POST",
        undefined,
        true
      );
      
      if (response && response.message) {
        alert(response.message); // Показываем сообщение об успехе
      } else {
        onError("Ошибка при запросе взносов");
      }
    } catch (err) {
      console.error("Ошибка при запросе взносов:", err);
      onError("Ошибка при запросе взносов");
    }
  };
  
  return (
    <div className={styles.tabContent}>
      <div className={styles.formContainer}>
        <h2>{editTournamentId ? "Редактировать турнир" : "Добавить новый турнир"}</h2>
        <form
          onSubmit={editTournamentId ? handleUpdateTournament : handleCreateTournament}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Название турнира</label>
            <input
              type="text"
              id="name"
              name="name"
              value={newTournament.name || ''}
              onChange={handleTournamentInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="type">Тип турнира</label>
            <select
              id="type"
              name="type"
              value={newTournament.type || ''}
              onChange={handleTournamentInputChange}
              required
            >
              <option value="">Выберите тип</option>
              <option value="solo">Одиночный</option>
              <option value="duo">Парный</option>
            </select>
          </div>
          
          
          {/* Добавляем выбор пола */}
          <div className={styles.formGroup}>
            <label htmlFor="sex_id">Пол участников</label>
            <select
              id="sex_id"
              name="sex_id"
              value={newTournament.sex_id || ''}  // Ensure default empty value if no selection
              onChange={handleTournamentInputChange}
              required
            >
              <option value="">Выберите пол</option>
              <option value="2">Мужчины</option>
              <option value="3">Женщины</option>
            </select>
          </div>
          
          
          {/* Добавляем выбор категории */}
          <div className={styles.formGroup}>
            <label htmlFor="category_id">Категория</label>
            <select
              id="category_id"
              name="category_id"
              value={newTournament.category_id || ''}
              onChange={handleTournamentInputChange}
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} {category.is_child ? '(Детская)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* Добавляем выбор региона */}
          <div className={styles.formGroup}>
            <label htmlFor="region_id">Регион</label>
            <select
              id="region_id"
              name="region_id"
              value={newTournament.region_id || ''}
              onChange={handleTournamentInputChange}
              required
            >
              <option value="">Выберите регион</option>
              {regions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="date">Дата проведения</label>
            <input
              type="datetime-local"
              id="date"
              name="date"
              value={(newTournament.date || '').slice(0, 16)}
              onChange={handleTournamentInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="address">Адрес</label>
            <input
              type="text"
              id="address"
              name="address"
              value={newTournament.address || ''}
              onChange={handleTournamentInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="photo" className={styles.fileLabel}>
              Выбрать файл
              <span
                className={`${styles.fileName} ${newTournament.photo_path ? '' : styles.noFile}`}>
      {newTournament.photo_path ? 'Файл выбран' : 'Нет файла'}
    </span>
              <input
                type="file"
                id="photo"
                name="photo"
                className={styles.fileInput}
                onChange={handleFileChange}
              />
            </label>
          </div>
          
          
          <div className={styles.formGroup}>
            <label htmlFor="price">Стоимость участия (за человека)</label>
            <input
              type="number"
              id="price"
              name="price"
              value={newTournament.price || 0}
              onChange={handleTournamentInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="prize_fund">Призовой фонд</label>
            <input
              type="number"
              id="prize_fund"
              name="prize_fund"
              value={newTournament.prize_fund || 0}
              onChange={handleTournamentInputChange}
              required
            />
          </div>
          
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="is_child"
              name="is_child"
              checked={!!newTournament.is_child}
              onChange={handleTournamentInputChange}
            />
            <label htmlFor="is_child">Детский турнир</label>
          </div>
          
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="can_register"
              name="can_register"
              checked={newTournament.can_register !== false}
              onChange={handleTournamentInputChange}
            />
            <label htmlFor="can_register">Возможна регистрация</label>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="organizer_name_and_contacts">Контакты
              организатора</label>
            <input
              type="text"
              id="organizer_name_and_contacts"
              name="organizer_name_and_contacts"
              value={newTournament.organizer_name_and_contacts || ''}
              onChange={handleTournamentInputChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="organizer_requisites">Реквизиты
              организатора</label>
            <input
              type="text"
              id="organizer_requisites"
              name="organizer_requisites"
              value={newTournament.organizer_requisites || ''}
              onChange={handleTournamentInputChange}
            />
          </div>
          
          
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitButton}>
              {editTournamentId ? 'Обновить турнир' : 'Создать турнир'}
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
              <th>Адрес</th>
              <th>Цена</th>
              <th>Пол</th>
              <th>Категория</th>
              <th>Регион</th>
              <th>Действия</th>
            </tr>
            </thead>
            <tbody>
            {tournaments.map((tournament) => (
              <tr key={tournament.id}>
                <td>{tournament.id}</td>
                <td>{tournament.name}</td>
                <td>{new Date(tournament.date).toLocaleDateString()}</td>
                <td>{tournament.address}</td>
                <td>{tournament.price}</td>
                <td>{tournament.sex_id === 2 ? 'Мужчины' : tournament.sex_id === 3 ? 'Женщины' : 'Не указан'}</td>
                <td>{categories.find(c => c.id === tournament.category_id)?.name || 'Не указана'}</td>
                <td>{regions.find(r => r.id === tournament.region_id)?.name || 'Не указан'}</td>
                <td>
                  {canEditTournament(tournament) && (
                    <div className={styles.actionButtons}>
                      <button
                        className={styles.editButton}
                        onClick={() => startEditTournament(tournament)}
                      >
                        Редактировать
                      </button>
                      
                      {/* Кнопка для закрытия/открытия регистрации */}
                      <button
                        className={styles.editButton}
                        onClick={() => handleToggleRegistration(tournament.id, tournament.can_register)}
                      >
                        {tournament.can_register ? "Закрыть регистрацию" : "Открыть регистрацию"}
                      </button>
                      
                      {/* Кнопка для запроса взносов */}
                      <button
                        className={styles.editButton}
                        onClick={() => handleSendMoneyRequest(tournament.id)}
                      >
                        Запросить взносы
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
  );
};

export default TournamentManagement;
