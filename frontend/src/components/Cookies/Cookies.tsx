import { useState, useEffect } from 'react';
import styles from './Cookies.module.scss';

function Cookies() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookieConsent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className={styles.cookieContainer}>
            <p className={styles.text}>
                Мы защищаем персональные данные пользователей <br />
                и используем Cookies на сайте. <br />
                Ознакомьтесь с нашими <br />
                <a
                    href="https://ace-deti.ru/uploads/c0e4f7f2-0c74-4f70-83dc-1fc3ae87a8ac.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                >
                    Политикой конфиденциальности
                </a>{' '}
                и <br />
                <a
                    href="https://ace-deti.ru/uploads/ed19f5ac-6b6c-4fea-b3d8-ed5ad5deacb5.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                >
                    Пользовательским соглашением
                </a>
                , чтобы узнать <br />
                больше.
            </p>
            <button onClick={handleAccept} className={styles.acceptButton} aria-label="Принять использование cookies">
                Понятно
            </button>
        </div>
    );
}

export default Cookies;