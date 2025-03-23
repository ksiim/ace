import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Schedule.module.scss';
import { apiRequest } from '../../../../utils/apiRequest';
import { Tournament, Region, Category } from '../../types.ts';

const Schedule: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sexes, setSexes] = useState<{ id: number; name: string; shortname: string }[]>([]);
  const [skip, setSkip] = useState<number>(0);
  const [limit] = useState<number>(10);
  const [regionId, setRegionId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [actual, setActual] = useState<boolean | null>(null);
  const [sexId, setSexId] = useState<number | null>(null); // Состояние для фильтра по полу
  const navigate = useNavigate();
  
  // Загрузка турниров
  useEffect(() => {
    const fetchTournaments = async () => {
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: limit.toString(),
        ...(regionId && { region_id: regionId.toString() }),
        ...(categoryId && { category_id: categoryId.toString() }),
        ...(type && { type }),
        ...(actual !== null && { actual: actual.toString() }),
        ...(sexId && { sex_id: sexId.toString() }), // Добавляем фильтр по полу
      }).toString();
      
      const response = await apiRequest(`tournaments/all?${params}`, 'GET', undefined, false);
      if (response && response.data) {
        setTournaments(response.data);
      }
    };
    
    fetchTournaments();
  }, [skip, limit, regionId, categoryId, type, actual, sexId]); // Добавляем sexId в зависимости
  
  // Загрузка регионов
  useEffect(() => {
    const fetchRegions = async () => {
      const response = await apiRequest('regions/', 'GET', undefined, false);
      if (response && response.data) {
        setRegions(response.data);
      }
    };
    
    fetchRegions();
  }, []);
  
  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      const response = await apiRequest('categories/', 'GET', undefined, false);
      if (response && response.data) {
        setCategories(response.data);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Загрузка данных о поле
  useEffect(() => {
    const fetchSexes = async () => {
      const response = await apiRequest('sex/', 'GET', undefined, false);
      if (response && response.data) {
        setSexes(response.data);
      }
    };
    
    fetchSexes();
  }, []);
  
  // Сброс фильтров
  const resetFilters = () => {
    setRegionId(null);
    setCategoryId(null);
    setType(null);
    setActual(null);
    setSexId(null); // Сбрасываем фильтр по полу
    setSkip(0);
  };
  
  const handleRowClick = (tournamentId: number) => {
    navigate(`/tournaments/${tournamentId}`);
  };
  
  // Функция для получения имени категории по ID
  const getCategoryNameById = (categoryId: number): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : 'Не указана';
  };
  
  // Функция для получения названия пола по ID
  const getSexNameById = (sexId: number): string => {
    const sex = sexes.find((s) => s.id === sexId);
    return sex ? sex.name : 'Не указан';
  };
  
  return (
    <div className={styles.tableContainer}>
      <div className={styles.filters}>
        {/* Фильтр по региону */}
        <select
          value={regionId || ''}
          onChange={(e) => setRegionId(Number(e.target.value) || null)}
        >
          <option value="">Выберите регион</option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
        
        {/* Фильтр по категории */}
        <select
          value={categoryId || ''}
          onChange={(e) => setCategoryId(Number(e.target.value) || null)}
        >
          <option value="">Выберите категорию</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        
        {/* Фильтр по типу турнира */}
        <select value={type || ''} onChange={(e) => setType(e.target.value || null)}>
          <option value="">Выберите тип</option>
          <option value="solo">Одиночный</option>
          <option value="duo">Парный</option>
        </select>
        
        {/* Фильтр по полу */}
        <select
          value={sexId || ''}
          onChange={(e) => setSexId(Number(e.target.value) || null)}
        >
          <option value="">Выберите пол</option>
          {sexes.map((sex) => (
            <option key={sex.id} value={sex.id}>
              {sex.name}
            </option>
          ))}
        </select>
        
        {/* Чекбокс для фильтрации по актуальным турнирам */}
        <div className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={actual || false}
            onChange={(e) => setActual(e.target.checked)}
            className={styles.checkboxInput}
          />
          <span className={styles.checkboxCustom}></span>
          Показывать актуальные
        </div>
        
        {/* Кнопка сброса фильтров */}
        <button className={styles.resetButton} onClick={resetFilters}>
          Сбросить фильтры
        </button>
      </div>
      
      <table className={styles.Schedule}>
        <thead>
        <tr>
          <th className={styles.dateColumn}>Дата</th>
          <th className={styles.nameColumn}>Название турнира</th>
          <th className={styles.locationColumn}>Место проведения</th>
          <th className={styles.refereeColumn}>Пол</th>
          <th className={styles.categoryColumn}>Категория</th>
        </tr>
        </thead>
        <tbody>
        {tournaments.map((tournament, index) => (
          <tr
            key={tournament.id}
            onClick={() => handleRowClick(tournament.id)}
            className={`${styles.tournamentRow} ${index % 2 === 1 ? styles.evenRow : ''}`}
          >
            <td>{new Date(tournament.date).toLocaleDateString()}</td>
            <td className={styles.nameCell}>{tournament.name}</td>
            <td>{tournament.address}</td>
            <td>{getSexNameById(tournament.sex_id)}</td>
            <td>{getCategoryNameById(tournament.category_id)}</td>
          </tr>
        ))}
        </tbody>
      </table>
      
      {/* Пагинация */}
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

export default Schedule;
