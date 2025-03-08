import React, {useEffect, useState} from 'react';
import { apiRequest } from "../../../../utils/apiRequest.ts";
import styles from "../../AdminPanel.module.scss";

interface Tournament {
  id: number;
  name: string;
  type: string;
  is_child: boolean;
  photo: string;
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
    photo: "",
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
  
  // Загружаем турниры, категории и регионы при монтировании компонента
  useEffect(() => {
    // Загрузка турниров
    apiRequest("tournaments/", "GET", undefined, true)
      .then((data) => {
        if (data && data.data) {
          setTournaments(data.data);
        } else {
          onError("Ошибка загрузки турниров");
        }
      })
      .catch(() => onError("Ошибка загрузки турниров"));
    
    // Загрузка категорий
    apiRequest("categories/", "GET", undefined, true)
      .then((data) => {
        if (data && data.data) {
          setCategories(data.data);
        } else {
          onError("Ошибка загрузки категорий");
        }
      })
      .catch(() => onError("Ошибка загрузки категорий"));
    
    // Загрузка регионов
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
  
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    
    apiRequest("tournaments/", "POST", newTournament, true)
      .then((data) => {
        if (data) {
          // Update internal component state first
          setTournaments(prevTournaments => [...prevTournaments, data]);
          
          // Now update the parent component's state using the callback
          onTournamentsUpdate(prevTournaments => {
            // Make sure prevTournaments is an array, if not return a new array with just the new tournament
            return Array.isArray(prevTournaments) ? [...prevTournaments, data] : [data];
          });
          
          // Reset form
          setNewTournament({
            name: "",
            type: "",
            is_child: false,
            photo: "",
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
  
  const startEditTournament = (tournament: Tournament) => {
    setEditTournamentId(tournament.id);
    setNewTournament({...tournament});
  };
  
  const handleUpdateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editTournamentId) return;
    
    apiRequest(`tournaments/${editTournamentId}`, "PUT", newTournament, true)
      .then((data) => {
        if (data) {
          // Обновляем внутреннее состояние компонента
          setTournaments(prevTournaments =>
            prevTournaments.map(t => t.id === editTournamentId ? { ...t, ...data } : t)
          );
          
          // Теперь обновляем состояние родительского компонента с помощью callback
          onTournamentsUpdate(prevTournaments => {
            // Убедимся, что prevTournaments - это массив
            if (!Array.isArray(prevTournaments)) return [data];
            
            return prevTournaments.map(t => t.id === editTournamentId ? { ...t, ...data } : t);
          });
          
          // Сброс состояния для редактируемого турнира
          setEditTournamentId(null);
          
          // Сброс значений нового турнира
          setNewTournament({
            name: "",
            type: "",
            is_child: false,
            photo: "",
            organizer_name_and_contacts: "",
            organizer_requisites: "",
            date: new Date().toISOString(),
            price: 0,
            can_register: true,
            address: "",
            prize_fund: 0,
            owner_id: currentUser.id,
            sex_id: 0, // Поставь нужное значение для sex_id (мужчины = 2, женщины = 3)
            category_id: 0, // Нужно будет подставить актуальную категорию
            region_id: 0 // Нужно будет подставить актуальный регион
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
  
  const cancelEdit = () => {
    setEditTournamentId(null);
    setNewTournament({
      name: "",
      type: "",
      is_child: false,
      photo: "",
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
  
  const canEditTournament = (tournament: Tournament) => {
    if (!currentUser) return false;
    return currentUser.admin || (currentUser.organizer && tournament.owner_id === currentUser.id);
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
            <input
              type="text"
              id="type"
              name="type"
              value={newTournament.type || ''}
              onChange={handleTournamentInputChange}
              required
            />
          </div>
          
          {/* Добавляем выбор пола */}
          <div className={styles.formGroup}>
            <label htmlFor="sex_id">Пол участников</label>
            <select
              id="sex_id"
              name="sex_id"
              value={newTournament.sex_id || ''}
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
            <label htmlFor="price">Цена</label>
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
      
      {/* Render tournament list */}
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
