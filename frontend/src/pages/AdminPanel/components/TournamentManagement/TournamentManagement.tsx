import React, { useEffect, useState } from 'react';
import { apiRequest } from "../../../../utils/apiRequest.ts";
import styles from "../../AdminPanel.module.scss";
import type { Category, Region, Sex, Tournament, TournamentManagementProps, Participant, Fio } from '../../types.ts';
import { Check, Clock, Trash2 } from 'lucide-react';

// Вспомогательные функции для работы с датами
const formatDateToDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Форматирование даты для input type="date" (гггг-мм-дд)
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // +1, так как месяцы начинаются с 0
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Начальное состояние турнира
const getInitialTournamentState = (ownerId: number): Partial<Tournament> => ({
  name: "",
  type: "",
  is_child: false,
  photo_path: "",
  organizer_name_and_contacts: "",
  organizer_requisites: "",
  date: "",
  description: "",
  price: 0,
  can_register: true,
  address: "",
  prize_fund: "",
  owner_id: ownerId,
  sex_id: 0,
  category_id: 0,
  region_id: 0,
  comment: "",
});

const TournamentManagement: React.FC<TournamentManagementProps> = ({
                                                                     currentUser,
                                                                     onTournamentsUpdate,
                                                                     onError
                                                                   }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [sexes, setSexes] = useState<Sex[]>([]);
  const [newTournament, setNewTournament] = useState<Partial<Tournament>>(
    getInitialTournamentState(currentUser.id)
  );
  
  const [editTournamentId, setEditTournamentId] = useState<number | null>(null);
  const [skip, setSkip] = useState<number>(0);
  const [limit] = useState<number>(10);
  
  const [filters, setFilters] = useState({
    skip: skip,
    limit: limit,
    region_id: null as number | null,
    category_id: null as number | null,
    sex_id: null as number | null,
    type: null as string | null,
    actual: null as boolean | null,
  });
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<Record<number, Fio>>({});
  
  useEffect(() => {
    participants.forEach(participant => {
      if (participant.user_id && !userDetails[participant.user_id]) {
        apiRequest(`users/${participant.user_id}/fio`, "GET", undefined, false)
          .then(response => {
            if (!response.error) {
              setUserDetails(prevDetails => ({
                ...prevDetails,
                [participant.user_id]: {
                  name: response.name,
                  surname: response.surname,
                  patronymic: response.patronymic
                },
              }));
            }
          })
          .catch(error => console.error("Ошибка запроса данных пользователя:", error));
      }
      
      if (participant.partner_id !== null && !userDetails[participant.partner_id]) {
        apiRequest(`users/${participant.partner_id}/fio`, "GET", undefined, false)
          .then(response => {
            if (!response.error) {
              setUserDetails(prevDetails => ({
                ...prevDetails,
                [participant.partner_id as number]: {
                  name: response.name,
                  surname: response.surname,
                  patronymic: response.patronymic
                },
              }));
            }
          })
          .catch(error => console.error("Ошибка запроса данных партнёра:", error));
      }
    });
  }, [participants, userDetails]);
  
  const fetchParticipants = async (tournamentId: number) => {
    try {
      const data = await apiRequest(`tournaments/${tournamentId}/participants`, "GET", undefined, true);
      if (data && data.data) {
        setParticipants(data.data);
        console.log(participants)
      } else {
        onError("Ошибка загрузки участников");
      }
    } catch (error) {
      onError("Ошибка загрузки участников");
    }
  };
  
  const confirmParticipant = async (participantId: number) => {
    try {
      const participant = participants.find(p => p.id === participantId);
      if (!participant) {
        onError("Участник не найден");
        return;
      }
      
      const response = await apiRequest(
        `participants/${participantId}`,
        "PUT",
        { ...participant, confirmed: true },
        true
      );
      
      if (response) {
        setParticipants(prevParticipants =>
          prevParticipants.map(p =>
            p.id === participantId ? { ...p, confirmed: true } : p
          )
        );
        alert("Участник подтвержден");
      } else {
        onError("Ошибка подтверждения участника");
      }
    } catch (err) {
      console.error("Ошибка подтверждения участника:", err);
      onError("Ошибка подтверждения участника");
    }
  };
  
  const disqualifyParticipant = async (participantId: number) => {
    // Добавляем подтверждение перед дисквалификацией
    const isConfirmed = window.confirm(
      "Вы точно хотите дисквалифицировать этого участника? Это действие нельзя отменить."
    );
    
    if (!isConfirmed) {
      return; // Если пользователь отказался, прерываем выполнение
    }
    
    try {
      const response = await apiRequest(
        `participants/${participantId}`,
        "DELETE",
        undefined,
        true
      );
      
      if (response) {
        setParticipants(prevParticipants =>
          prevParticipants.filter(p => p.id !== participantId)
        );
        alert("Участник дисквалифицирован");
      } else {
        onError("Ошибка дисквалификации участника");
      }
    } catch (err) {
      console.error("Ошибка дисквалификации участника:", err);
      onError("Ошибка дисквалификации участника");
    }
  };
  
  const fetchTournaments = async () => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...(filters.region_id !== null && { region_id: filters.region_id.toString() }),
      ...(filters.category_id !== null && { category_id: filters.category_id.toString() }),
      ...(filters.sex_id !== null && { sex_id: filters.sex_id.toString() }),
      ...(filters.type !== null && { type: filters.type }),
      ...(filters.actual !== null && { actual: filters.actual.toString() }),
    }).toString();
    
    try {
      const data = await apiRequest(`tournaments/?${params}`, "GET", undefined, true);
      if (data && data.data) {
        setTournaments(data.data);
      } else {
        onError("Ошибка загрузки турниров");
      }
    } catch (error) {
      onError("Ошибка загрузки турниров");
    }
  };
  
  useEffect(() => {
    fetchTournaments();
  }, [skip, limit, filters]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "actual") {
      setFilters((prev) => ({
        ...prev,
        actual: value === "all" ? null : value === "true",
      }));
      return;
    }
    
    setFilters((prev) => ({
      ...prev,
      [name]: value === "" ? null : name === "region_id" || name === "category_id" || name === "sex_id" ? Number(value) : value,
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      skip: 0,
      limit: limit,
      region_id: null,
      category_id: null,
      sex_id: null,
      type: null,
      actual: null,
    });
    setSkip(0);
  };
  
  useEffect(() => {
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
    
    apiRequest("sex/", "GET", undefined, true)
      .then((data) => {
        if (data && data.data) {
          setSexes(data.data);
        } else {
          onError("Ошибка загрузки полов");
        }
      })
      .catch(() => onError("Ошибка загрузки полов"));
  }, []);
  
  const handleTournamentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let parsedValue: string | number | boolean = value;
    
    if (type === 'number') {
      parsedValue = value.replace(/^0+/, '') || '0';
    }
    
    if (name === 'date') {
      parsedValue = value; // Уже в формате гггг-мм-дд от input
    }
    
    if (type === 'checkbox' && name === 'is_child' && 'checked' in e.target) {
      const checked = (e.target as HTMLInputElement).checked;
      const mixedSexId = getMixedSexId();
      setNewTournament(prev => ({
        ...prev,
        [name]: checked,
        sex_id: checked ? mixedSexId || prev.sex_id || 0 : prev.sex_id || 0,
      }));
    } else {
      setNewTournament(prev => ({
        ...prev,
        [name]: parsedValue,
      }));
    }
  };
  
  const handleDeleteTournament = async (tournamentId: number) => {
    // Создаем модальное окно подтверждения
    const isConfirmed = window.confirm(
      "Вы точно хотите удалить этот турнир? Это действие нельзя отменить."
    );
    
    if (!isConfirmed) {
      return; // Если пользователь отказался, прерываем выполнение
    }
    
    try {
      const response = await apiRequest(
        `tournaments/${tournamentId}`,
        "DELETE",
        undefined,
        true
      );
      
      if (response) {
        setTournaments((prevTournaments) =>
          prevTournaments.filter((t) => t.id !== tournamentId)
        );
        
        onTournamentsUpdate((prevTournaments) =>
          Array.isArray(prevTournaments)
            ? prevTournaments.filter((t) => t.id !== tournamentId)
            : []
        );
        
        alert("Турнир успешно удален");
      } else {
        onError("Ошибка при удалении турнира");
      }
    } catch (err) {
      console.error("Ошибка при удалении турнира:", err);
      onError("Ошибка при удалении турнира");
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        onError("Загружать можно только изображения");
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      apiRequest("uploads/", "POST", formData, true)
        .then((data) => {
          if (data && data.file_path) {
            const correctPath = `${(data.file_path).slice(4)}`;
            setNewTournament(prev => ({
              ...prev,
              photo_path: correctPath
            }));
          } else {
            onError("Ошибка загрузки фото");
          }
        })
        .catch(() => onError("Ошибка загрузки фото"));
    }
  };
  
  const getMixedSexId = () => {
    const mixedSex = sexes.find(sex => sex.shortname === 'mixed');
    return mixedSex ? mixedSex.id : null;
  };
  
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mixedSexId = getMixedSexId();
    if (newTournament.is_child && newTournament.sex_id !== mixedSexId) {
      onError("Для детского турнира пол должен быть 'Микст'.");
      return;
    }
    
    if (!newTournament.name || !newTournament.type || !newTournament.date || !newTournament.description) {
      onError("Заполните все обязательные поля.");
      return;
    }
    
    apiRequest("tournaments/", "POST", newTournament, true)
      .then((data) => {
        if (data) {
          setTournaments(prevTournaments => [...prevTournaments, data]);
          onTournamentsUpdate(prevTournaments => {
            return Array.isArray(prevTournaments) ? [...prevTournaments, data] : [data];
          });
          
          setNewTournament(getInitialTournamentState(currentUser.id));
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
    setNewTournament(getInitialTournamentState(currentUser.id));
  };
  
  const startEditTournament = (tournament: Tournament) => {
    setEditTournamentId(tournament.id);
    setNewTournament({
      ...tournament,
      date: formatDateForInput(tournament.date) // Преобразуем дату в формат гггг-мм-дд
    });
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
          setNewTournament(getInitialTournamentState(currentUser.id));
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
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (!tournament) {
        onError("Турнир не найден");
        return;
      }
      
      const updatedTournament = {
        ...tournament,
        can_register: !canRegister,
      };
      
      const response = await apiRequest(
        `tournaments/${tournamentId}`,
        "PUT",
        updatedTournament,
        true
      );
      
      if (response) {
        setTournaments(prevTournaments =>
          prevTournaments.map(t =>
            t.id === tournamentId ? { ...t, can_register: !canRegister } : t
          )
        );
        
        onTournamentsUpdate(prevTournaments => {
          if (Array.isArray(prevTournaments)) {
            return prevTournaments.map(t =>
              t.id === tournamentId ? { ...t, can_register: !canRegister } : t
            );
          } else {
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
  
  const getSexNameById = (sexId: number) => {
    const sex = sexes.find(sex => sex.id === sexId);
    return sex ? sex.name : 'Не указан';
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
        alert(response.message);
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
        <form onSubmit={editTournamentId ? handleUpdateTournament : handleCreateTournament}>
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
          
          <div className={styles.formGroup}>
            <label htmlFor="sex_id">Пол участников</label>
            <select
              id="sex_id"
              name="sex_id"
              value={newTournament.sex_id || ''}
              onChange={handleTournamentInputChange}
              required
              disabled={!!newTournament.is_child}
            >
              <option value="">Выберите пол</option>
              {sexes.map(sex => (
                <option key={sex.id} value={sex.id}>
                  {sex.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="category_id">Категория</label>
            <select
              id="category_id"
              name="category_id"
              value={newTournament.category_id || 0}
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
          
          <div className={styles.formGroup}>
            <label htmlFor="region_id">Регион</label>
            <select
              id="region_id"
              name="region_id"
              value={newTournament.region_id || 0}
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
              type="date"
              id="date"
              name="date"
              value={newTournament.date || ''} // Отображаем как есть
              onChange={handleTournamentInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="description">Время проведения (по местному времени)</label>
            <input
              type="text"
              id="description"
              name="description"
              value={newTournament.description || ''}
              onChange={handleTournamentInputChange}
              placeholder="Например, 15:00"
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
            <label htmlFor="photo" className={styles.fileLabel}>Фотография турнира</label>
            <input
              type="file"
              id="photo"
              name="photo"
              className={styles.fileInput}
              onChange={handleFileChange}
            />
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
              type="string"
              id="prize_fund"
              name="prize_fund"
              value={newTournament.prize_fund || ''}
              onChange={handleTournamentInputChange}
            />
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
            <label htmlFor="organizer_name_and_contacts">Контакты организатора</label>
            <input
              type="text"
              id="organizer_name_and_contacts"
              name="organizer_name_and_contacts"
              value={newTournament.organizer_name_and_contacts || ''}
              onChange={handleTournamentInputChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="organizer_requisites">Реквизиты организатора</label>
            <input
              type="text"
              id="organizer_requisites"
              name="organizer_requisites"
              value={newTournament.organizer_requisites || ''}
              onChange={handleTournamentInputChange}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="comment">Комментарий</label>
            <textarea
              id="comment"
              name="comment"
              value={newTournament.comment || ''}
              onChange={handleTournamentInputChange}
              placeholder="Введите комментарий к турниру"
              rows={4}
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
        <div className={styles.filters}>
          <select
            name="region_id"
            value={filters.region_id || ''}
            onChange={handleFilterChange}
          >
            <option value="">Все регионы</option>
            {regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          
          <select
            name="category_id"
            value={filters.category_id || ''}
            onChange={handleFilterChange}
          >
            <option value="">Все категории</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            name="sex_id"
            value={filters.sex_id || ''}
            onChange={handleFilterChange}
          >
            <option value="">Все полы</option>
            {sexes.map(sex => (
              <option key={sex.id} value={sex.id}>
                {sex.name}
              </option>
            ))}
          </select>
          
          <select
            name="type"
            value={filters.type || ''}
            onChange={handleFilterChange}
          >
            <option value="">Все типы</option>
            <option value="solo">Одиночный</option>
            <option value="duo">Парный</option>
          </select>
          
          <select
            name="actual"
            value={filters.actual === null ? 'all' : filters.actual ? 'true' : 'false'}
            onChange={handleFilterChange}
          >
            <option value="all">По актуальности</option>
            <option value="true">Актуальные</option>
            <option value="false">Неактуальные</option>
          </select>
          
          <button className={styles.resetButton} type="button" onClick={resetFilters}>
            Сбросить фильтры
          </button>
        </div>
        
        {selectedTournamentId && (
          <div className={styles.participantsModal}>
            <h3>Участники турнира</h3>
            {participants.length === 0 ? (
              <p className={styles.noParticipants}>Пока никто не зарегистрировался</p>
            ) : (
              <ul className={styles.participantList}>
                {participants.map(participant => (
                  <li key={participant.id} className={styles.participantItem}>
                    <span className={styles.participantName}>
                      {userDetails[participant.user_id]?.surname} {userDetails[participant.user_id]?.name}
                      {userDetails[participant.user_id]?.patronymic && (
                        <> {userDetails[participant.user_id]?.patronymic}</>
                      )}
                      {participant.partner_id !== null && userDetails[participant.partner_id] && (
                        <> / {userDetails[participant.partner_id]?.surname} {userDetails[participant.partner_id]?.name}
                          {userDetails[participant.partner_id]?.patronymic && (
                            <> {userDetails[participant.partner_id]?.patronymic}</>
                          )}
                        </>
                      )}
                    </span>
                    {participant.confirmed ? (
                      <span className={`${styles.participantStatus} ${styles.confirmed}`}><Check/></span>
                    ) : <span className={`${styles.participantStatus} ${styles.confirmed}`}><Clock color={'#f95e1b'}/></span>
                    }
                    <div className={styles.participantActions}>
                      <button onClick={() => confirmParticipant(participant.id)}>Подтвердить</button>
                      <button onClick={() => disqualifyParticipant(participant.id)}>Дисквалифицировать</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setSelectedTournamentId(null)}>Закрыть</button>
          </div>
        )}
        
        <h2>Список турниров</h2>
        {tournaments.length > 0 ? (
          <table className={styles.dataTable}>
            <thead>
            <tr>
              <th className={styles.tableHeader}>ID</th>
              <th className={styles.tableHeader}>Название</th>
              <th className={styles.tableHeader}>Дата</th>
              <th className={styles.tableHeader}>Адрес</th>
              <th className={styles.tableHeader}>Цена</th>
              <th className={styles.tableHeader}>Пол</th>
              <th className={styles.tableHeader}>Категория</th>
              <th className={styles.tableHeader}>Регион</th>
              <th className={styles.tableHeader}>Действия</th>
            </tr>
            </thead>
            <tbody>
            {tournaments.map((tournament) => (
              <tr key={tournament.id}>
                <td>{tournament.id}</td>
                <td>{tournament.name}</td>
                <td>{formatDateToDisplay(tournament.date)}</td>
                <td>{tournament.address}</td>
                <td>{tournament.price}</td>
                <td>{getSexNameById(tournament.sex_id)}</td>
                <td>
                  {categories.find((c) => c.id === tournament.category_id)?.name || 'Не указана'}
                </td>
                <td>
                  {regions.find((r) => r.id === tournament.region_id)?.name || 'Не указан'}
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
                        className={styles.editButton}
                        onClick={() =>
                          handleToggleRegistration(tournament.id, tournament.can_register)
                        }
                      >
                        {tournament.can_register
                          ? 'Закрыть регистрацию'
                          : 'Открыть регистрацию'}
                      </button>
                      <button
                        className={styles.editButton}
                        onClick={() => handleSendMoneyRequest(tournament.id)}
                      >
                        Запросить взносы
                      </button>
                      <button
                        className={styles.editButton}
                        onClick={() => {
                          setSelectedTournamentId(tournament.id);
                          fetchParticipants(tournament.id);
                        }}
                      >
                        Управление участниками
                      </button>
                      <Trash2
                        color={'#ff0000'}
                        onClick={() => handleDeleteTournament(tournament.id)}
                        size={30}
                      />
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

export default TournamentManagement;
