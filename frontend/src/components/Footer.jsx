import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="asp-footer">
            <div className="footer-content">
                <p className="copyright">
                    ASP Project © {currentYear}.
                </p>
                <p className="tagline">
                    Безопасно. Анонимно. Бесплатно.
                </p>
                <div className="footer-links">
                    {/* Ссылки-заглушки, можно будет оживить позже */}
                    <a href="/privacy">Политика конфиденциальности</a>
                    <span className="separator">•</span>
                    <a href="/contacts">Контакты</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;