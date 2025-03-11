import React, { useState } from 'react';
import { Star } from 'lucide-react';
import styles from './PlanCard.module.scss';
import { apiRequest } from '../../../../../utils/apiRequest.ts'; // Путь к файлу может отличаться

export interface PlanFeature {
  text: string;
}

export interface SubscriptionPlan {
  type: string;
  period: string;
  features: PlanFeature[];
  price: number | null;
  isPopular?: boolean;
}

interface Transaction {
  amount: number;
  payment_link: string;
  operation_id: string;
  months: number;
  status: string;
  created_at: string;
  updated_at: string;
  id: number;
  user_id: number;
}

interface PlanCardProps {
  type: string;
  period: string;
  features: PlanFeature[];
  price: number | null;
}

export const PlanCard: React.FC<PlanCardProps> = ({
                                                    type,
                                                    period,
                                                    features,
                                                    price
                                                  }) => {
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Определяем количество месяцев из периода
  const getMonths = (): number => {
    return type === 'halfyear' ? 6 : 12;
  };
  
  // Создание транзакции
  const handleSubscribe = async () => {
    if (price === null) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Создаем транзакцию через apiRequest
      const params = new URLSearchParams({
        amount: price.toString(),
        months: getMonths().toString()
      }).toString();
      
      const response = await apiRequest(
        `transactions/?${params}`,
        "POST",
        undefined,
        true // Требуется авторизация
      );
      
      if (response.error) {
        throw new Error(`Ошибка создания транзакции: ${response.status}`);
      }
      
      setTransaction(response);
      
      // Если есть payment_link, перенаправляем пользователя
      if (response.payment_link) {
        window.open(response.payment_link, '_blank');
      }
      
    } catch (err) {
      setError('Не удалось создать транзакцию. Попробуйте позже.');
      console.error('Ошибка при создании транзакции:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const executeTransaction = async () => {
    if (!transaction?.id) return;
    
    try {
      setLoading(true);
      
      const response = await apiRequest(
        `transactions/${transaction.id}/execute`,
        "POST",
        undefined,
        true // Требуется авторизация
      );
      
      if (response.error) {
        throw new Error(`Ошибка выполнения транзакции: ${response.status}`);
      }
      
      alert('Транзакция успешно выполнена!');
      
    } catch (err) {
      setError('Не удалось выполнить транзакцию.');
      console.error('Ошибка при выполнении транзакции:', err);
    } finally {
      setLoading(false);
    }
  };
  
  
  // Проверка статуса транзакции
  const checkTransactionStatus = async () => {
    if (!transaction?.id) return;
    
    try {
      setLoading(true);
      
      const response = await apiRequest(
        `transactions/${transaction.id}`,
        "GET",
        undefined,
        true // Требуется авторизация
      );
      
      if (response.error) {
        throw new Error(`Ошибка проверки статуса: ${response.status}`);
      }
      
      setTransaction(response);
      
      // Если статус изменился на APPROVED
      if (response.status === 'APPROVED') {
        await executeTransaction();
        alert('Подписка успешно оформлена!');
      }
      
    } catch (err) {
      setError('Не удалось проверить статус транзакции.');
      console.error('Ошибка при проверке статуса:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.card}>
      <div className={styles.icon}>
        <Star size={50} className={styles.star} strokeWidth={1} color={'#f95e1b'} fill={'#f95e1b'}/>
      </div>
      <h3 className={styles.period}>{period}</h3>
      <ul className={styles.features}>
        {features.map((feature, index) => (
          <li key={index} className={styles.feature}>
            {feature.text}
          </li>
        ))}
      </ul>
      {price !== null && (
        <>
          <div className={styles.price}>{price} ₽</div>
          
          {transaction ? (
            <div className={styles.transactionContainer}>
              {transaction.status !== 'APPROVED' && (
                <>
                  <button
                    className={styles.button}
                    onClick={checkTransactionStatus}
                    disabled={loading}
                  >
                    {loading ? 'Проверяем...' : 'Проверить оплату'}
                  </button>
                  
                  {transaction.payment_link && (
                    <button
                      className={`${styles.button} ${styles.secondaryButton}`}
                      onClick={() => window.open(transaction.payment_link, '_blank')}
                    >
                      Оплатить повторно
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <button
              className={styles.button}
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? 'Загрузка...' : 'Оформить'}
            </button>
          )}
          
          {error && <p className={styles.errorText}>{error}</p>}
        </>
      )}
    </div>
  );
};
