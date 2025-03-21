import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Schedule.module.scss';
import { apiRequest } from '../../../../utils/apiRequest';
import { Tournament, Region, Category } from '../../types.ts';

const Schedule: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [skip, setSkip] = useState<number>(0);
  const [limit] = useState<number>(10);
  const [regionId, setRegionId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [actual, setActual] = useState<boolean | null>(null); // Новое состояние для актуальных турниров
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
        ...(actual !== null && { actual: actual.toString() }), // Добавляем параметр actual, если он не null
      }).toString();
      
      const response = await apiRequest(`tournaments/all?${params}`, 'GET', undefined, false);
      if (response && response.data) {
        setTournaments(response.data);
      }
    };
    
    fetchTournaments();
  }, [skip, limit, regionId, categoryId, type, actual]); // Добавляем actual в зависимости
  
  // Загрузка регионов
  useEffect(() => {
    const fetchRegions = async () => {
      const response = await apiRequest('regions/', 'GET', undefined, true);
      if (response && response.data) {
        setRegions(response.data);
      }
    };
    
    fetchRegions();
  }, []);
  
  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      const response = await apiRequest('categories/', 'GET', undefined, true);
      if (response && response.data) {
        setCategories(response.data);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Сброс фильтров
  const resetFilters = () => {
    setRegionId(null);
    setCategoryId(null);
    setType(null);
    setActual(null); // Сбрасываем фильтр актуальности
    setSkip(0); // Сбрасываем пагинацию
  };
  
  const handleRowClick = (tournamentId: number) => {
    navigate(`/tournaments/${tournamentId}`);
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
        <select value={type || ''}
                onChange={(e) => setType(e.target.value || null)}>
          <option value="">Выберите тип</option>
          <option value="solo">Одиночный</option>
          <option value="duo">Парный</option>
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
          <th className={styles.refereeColumn}>Организатор</th>
          <th className={styles.categoryColumn}>Тип</th>
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
            <td>{tournament.organizer_name_and_contacts}</td>
            <td>{tournament.type === 'solo' ? 'Одиночный' : 'Парный'}</td>
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
