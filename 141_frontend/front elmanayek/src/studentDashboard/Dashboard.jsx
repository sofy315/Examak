import React from "react";
import { FaBars, FaCheckCircle, FaTimes, FaChevronRight } from "react-icons/fa";
import style from "./Dashboard.module.css";
import emmanuelPhoto from "./OIP (1).jpg";
import alicePhoto from "./OIP (2).jpg";
import harrisonPhoto from "./OIP (3).jpg";
import jonesPhoto from "./OIP (4).jpg";
const Dashboard = () => {
  return (
    <>
      <main className={style.content}>
        <div className="row">
          <div className="col-md-5">
            <section className={style.section}>
              <h2 className={style.sectionTitle}>Upcoming quiz   <a href="#" className={`${style.link} float-end`}>
                    Quiz directory →
                  </a></h2>

              <div className={style.subsection}>
                <div className={style.subsectionHeader}>
                  {/* <h3 className={style.subsectionTitle}>Upcoming quizzes</h3> */}
               
                </div>

                <div className={`row ${style.card}`}>
                  <h4 className={style.cardTitle}>
                    Introduction to computer programming
                  </h4>
                  <p className={style.cardDate}>12 / 03 / 2023 | 09:00 AM</p>
                  <div className={style.cardFooter}>
                    <span>No. of student's enrolled: 32</span>
                    <button className={style.status}>Open</button>
                  </div>
                </div>

                <div className={style.card}>
                  <h4 className={style.cardTitle}>Psychology 101</h4>
                  <p className={style.cardDate}>27 / 03 / 2023 | 12:00 PM</p>
                  <div className={style.cardFooter}>
                    <span>No. of student's enrolled: 17</span>
                    <button className={style.status}>Open</button>
                  </div>
                </div>
              </div>
            </section>{" "}
            <br />

          </div>
          {/* New Quiz Section */}

          <div className="col-md-7">
   
          </div>
        </div>
      </main>
    </>
  );
};

export default Dashboard;
