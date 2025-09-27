import React, { useState, useEffect } from 'react';
import styles from './Rating.module.scss';
import Header from '../../components/Header/Header.tsx';
import Footer from '../../components/Footer/Footer.tsx';
import { apiRequest } from '../../utils/apiRequest.ts'; // Импортируем ваш apiRequest

interface Player {
  id: number;
  name: string;
  surname: string;
  patronymic: string;
  birth_date: string;
  region_id: number;
  score: number;
  tournaments: number;
  sex_id: number;
}

interface Sex {
  id: number;
  name: string;
}

interface Region {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  is_child: boolean;
  from_age: number;
  to_age: number;
}

const Rating: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSex, setSelectedSex] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sexes, setSexes] = useState<Sex[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [skip, setSkip] = useState<number>(0);
  const [limit] = useState<number>(10);
  
  const fetchTournamentCount = async (userId: number) => {
    const response = await apiRequest(
      `users/${userId}/tournament-count-per-52-weeks`,
      'GET',
      undefined,
      false
    );
    if (!response.error && response.count_of_tournament_last_52_weeks !== undefined) {
      return response.count_of_tournament_last_52_weeks;
    }
    return 0;
  };
  
  const fetchPlayers = async () => {
    const params = new URLSearchParams({
      ...(searchTerm && { fio: searchTerm }),
      ...(selectedSex !== null && { sex_id: selectedSex.toString() }),
      ...(selectedRegion !== null && { region_id: selectedRegion.toString() }),
      ...(selectedCategory !== null && { category_id: selectedCategory.toString() }), // Добавляем фильтр по категории
      skip: skip.toString(),
      limit: limit.toString(),
    }).toString();
    
    const response = await apiRequest(`users/?${params}&is_admin=false&is_organizer=false&score_order=desc`, 'GET', undefined, false);
    if (!response.error && response.data) {
      const playersWithTournaments = await Promise.all(
        response.data.map(async (player: Player) => {
          const tournaments = await fetchTournamentCount(player.id);
          return { ...player, tournaments };
        })
      );
      setPlayers(playersWithTournaments);
      setFilteredPlayers(playersWithTournaments);
    } else {
      console.error('Ошибка при загрузке игроков:', response);
    }
  };
  
  const fetchSexes = async () => {
    const response = await apiRequest('sex/', 'GET');
    if (!response.error && response.data) {
      setSexes(response.data);
    } else {
      console.error('Ошибка при загрузке полов:', response);
    }
  };
  
  const fetchRegions = async () => {
    const response = await apiRequest('regions/', 'GET');
    if (!response.error && response.data) {
      setRegions(response.data);
    } else {
      console.error('Ошибка при загрузке регионов:', response);
    }
  };
  
  const fetchCategories = async () => {
    const response = await apiRequest('categories/', 'GET');
    if (!response.error && response.data) {
      setCategories(response.data);
    } else {
      console.error('Ошибка при загрузке категорий:', response);
    }
  };
  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSex(null);
    setSelectedRegion(null);
    setSelectedCategory(null);
  };
  
  useEffect(() => {
    fetchPlayers();
    fetchSexes();
    fetchRegions();
    fetchCategories();
  }, [searchTerm, selectedSex, selectedRegion, selectedCategory, skip, limit]);
  
  useEffect(() => {
    let result = [...players];
    
    if (searchTerm) {
      result = result.filter(player =>
        `${player.name} ${player.surname} ${player.patronymic}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedSex) {
      result = result.filter(player => player.sex_id === selectedSex);
    }
    
    if (selectedRegion) {
      result = result.filter(player => player.region_id === selectedRegion);
    }
    
    // Сортировка по очкам
    result.sort((a, b) => b.score - a.score);
    
    // Добавление места (позиции) каждому игроку
    result = result.map((player, index) => ({
      ...player,
      place: index + 1
    }));
    
    setFilteredPlayers(result);
  }, [players, searchTerm, selectedSex, selectedRegion]);
  
  return (
    <div className={styles.wrapper}>
      <Header scrollToBenefits={() => {}} />
      <div className={styles.classificationContainer}>
        <h1 className={styles.title}>Классификация
          на {new Date().toLocaleDateString('ru-RU')}</h1>
        
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Поиск по ФИО..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.filterInput}
          />
          
          <select
            value={selectedSex || ''}
            onChange={(e) => setSelectedSex(Number(e.target.value) || null)}
            className={styles.select}
          >
            <option value="">Любой пол</option>
            {sexes.map(sex => (
              <option key={sex.id} value={sex.id}>
                {sex.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedRegion || ''}
            onChange={(e) => setSelectedRegion(Number(e.target.value) || null)}
            className={styles.select}
          >
            <option value="">Все регионы</option>
            {regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(Number(e.target.value) || null)}
            className={styles.select}
          >
            <option value="">Все категории</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <button onClick={resetFilters} className={styles.resetButton}>
            Сбросить фильтры
          </button>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.classificationTable}>
            <thead>
              <tr>
                <th className={styles.place}>Место</th>
                <th>ФИО</th>
                <th>Дата рождения</th>
                <th>Регион</th>
                <th className={styles.score}>Очки</th>
                <th className={styles.tournaments52}>Кол-во турниров за 52 недели</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((player, index) => (
                <tr key={player.id}
                    className={index % 2 === 0 ? styles.evenRow : ''}>
                  <td className={styles.place}>{index + 1 + skip}</td>
                  <td>{`${player.surname} ${player.name} ${player.patronymic}`}</td>
                  <td>{player.birth_date || '-'}</td>
                  <td>{regions.find(region => region.id === player.region_id)?.name || '-'}</td>
                  <td className={styles.score}>{player.score}</td>
                  <td className={styles.tournaments52}>{player.tournaments}</td>
                </tr>
            ))}
            </tbody>
          </table>
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
      <Footer/>
    </div>
  );
};

export default Rating;
