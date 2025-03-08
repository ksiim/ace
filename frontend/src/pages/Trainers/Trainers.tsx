import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../utils/apiRequest.ts';  // Импортируем функцию apiRequest
import styles from './Trainers.module.scss';
import Header from '../../components/Header/Header.tsx';

interface Trainer {
  name: string;
  photo: string;
  description: string;
  phone: string;
  address: string;
  id: number;
}

const Trainers: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    const fetchTrainers = async () => {
      setLoading(true);
      const response = await apiRequest('trainers', 'GET', undefined, true);  // GET-запрос к /api/v1/trainers
      if (response.error) {
        setError('Не удалось загрузить данные тренеров');
      } else {
        setTrainers(response.data);
      }
      setLoading(false);
    };
    
    fetchTrainers();
  }, []);
  
  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;
  
  return (
    <>
      <Header scrollToBenefits = { () => {}}/>
    <div className={styles.trainersContainer}>
      <h2 className={styles.title}>Наши тренеры</h2>
      <div className={styles.trainersList}>
        {trainers.map((trainer) => (
          <div key={trainer.id} className={styles.trainerCard}>
            <img src={trainer.photo} alt={trainer.name} className={styles.trainerPhoto} />
            <div className={styles.trainerInfo}>
              <h3 className={styles.trainerName}>{trainer.name}</h3>
              <p className={styles.trainerDescription}>{trainer.description}</p>
              <p className={styles.trainerContact}>
                <span>Телефон: {trainer.phone}</span>
                <span>Адрес: {trainer.address}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default Trainers;
