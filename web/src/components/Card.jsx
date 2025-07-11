import React from "react";
import styles from "./Card.module.css";

const Card = ({ title, value, icon }) => (
  <div className={styles.card}>
    <div className={styles["card-content"]}>
      <div className={styles["card-info"]}>
        <div className={styles["card-info-head"]}>
          <h4>{title}</h4>
          {icon && <div className={styles["card-icon"]}>{icon}</div>}
        </div>
        <h2>{value}</h2>
      </div>
    </div>
  </div>
);

export default Card;
