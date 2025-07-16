import React from "react";
import styles from "./Card.module.css";

const Card = ({ title, value, icon, subtitle }) => (
  <div className={styles.card}>
    <div className={styles["card-content"]}>
      <div className={styles["card-info"]}>
        <div className={styles["card-info-head"]}>
          <h4 style={{color: "rgb(75 85 99)", fontWeight: "500", fontSize: "14px", lineHeight: "20px"}}>{title}</h4>
          {icon && <div className={styles["card-icon"]}>{icon}</div>}
        </div>
        <h2 style={{fontSize: "30px", lineHeight: "36px"}}>{value}</h2>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
    </div>
  </div>
);

export default Card;
