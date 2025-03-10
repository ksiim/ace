import React, { useState, useEffect } from 'react';
import styles from './Rating.module.scss';
import Header from '../../components/Header/Header.tsx';
import Footer from '../../components/Footer/Footer.tsx';

interface Player {
  place: number;
  name: string;
  birthDate?: string;
  city: string;
  points: number;
  tournaments: number;
  category?: string; // Категория игрока
}

const Rating: React.FC = () => {
  // Обновлённые данные с новыми категориями
  const [players] = useState<Player[]>([
    { place: 1, name: 'Захарченко Валерия', city: 'Ростов-на-Дону', points: 75, tournaments: 1, category: 'До 17 лет' },
    { place: 2, name: 'Ширяева Александрина', city: 'Ростов-на-Дону', points: 60, tournaments: 1, category: 'До 15 лет' },
    { place: 3, name: 'Ващенко Артем', city: 'Таганрог', points: 45, tournaments: 1, category: 'До 13 лет' },
    { place: 4, name: 'Шитова Милана', city: 'Таганрог', points: 45, tournaments: 1, category: '9-10 лет' },
    { place: 5, name: 'Лукашева Вера', city: 'Ростов-на-Дону', points: 30, tournaments: 1, category: 'Зеленый мяч' },
    { place: 6, name: 'Иванов Иван', city: 'Москва', points: 25, tournaments: 1, category: 'Оранжевый мяч' },
    { place: 7, name: 'Петров Петр', city: 'Санкт-Петербург', points: 20, tournaments: 1, category: 'Красный мяч' },
  ]);
  
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>(players);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  
  // Уникальные категории и города для фильтров
  const categories = ['До 17 лет', 'До 15 лет', 'До 13 лет', '9-10 лет', 'Зеленый мяч', 'Оранжевый мяч', 'Красный мяч'];
  const cities = Array.from(new Set(players.map(player => player.city)));
  
  useEffect(() => {
    let result = [...players];
    
    // Фильтр по поисковому запросу (имя)
    if (searchTerm) {
      result = result.filter(player =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Фильтр по категории
    if (selectedCategory) {
      result = result.filter(player => player.category === selectedCategory);
    }
    
    // Фильтр по городу
    if (selectedCity) {
      result = result.filter(player => player.city === selectedCity);
    }
    
    // Сортировка по очкам (по убыванию)
    result.sort((a, b) => b.points - a.points);
    
    // Обновление мест после фильтрации и сортировки
    result = result.map((player, index) => ({
      ...player,
      place: index + 1
    }));
    
    setFilteredPlayers(result);
  }, [players, searchTerm, selectedCategory, selectedCity]);
  
  return (
    <div className={styles.wrapper}>
      <Header scrollToBenefits={() => {}} />
      <div className={styles.classificationContainer}>
        <h1 className={styles.title}>Классификация на {new Date().toLocaleDateString('ru-RU')}</h1>
        
        <div className={styles.filtersContainer}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Поиск по фамилии..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <div className={styles.searchSuggestions}>
                {players
                  .filter(player => player.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .slice(0, 5)
                  .map((player, index) => (
                    <div
                      key={index}
                      className={styles.suggestion}
                      onClick={() => setSearchTerm(player.name)}
                    >
                      {player.name}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
          
          <div className={styles.filterSelect}>
            <label htmlFor="category">Категория:</label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.select}
            >
              <option value="">Все категории</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterSelect}>
            <label htmlFor="city">Город:</label>
            <select
              id="city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className={styles.select}
            >
              <option value="">Все города</option>
              {cities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className={styles.tableContainer}>
          <table className={styles.classificationTable}>
            <thead>
            <tr>
              <th>Место</th>
              <th>ФИО</th>
              <th>Дата рождения</th>
              <th>Город</th>
              <th>Очки</th>
              <th>Кол-во турниров за 52 недели</th>
            </tr>
            </thead>
            <tbody>
            {filteredPlayers.map((player, index) => (
              <tr key={index} className={index % 2 === 0 ? styles.evenRow : ''}>
                <td>{player.place}</td>
                <td>{player.name}</td>
                <td>{player.birthDate || '-'}</td>
                <td>{player.city}</td>
                <td>{player.points}</td>
                <td>{player.tournaments}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Rating;
