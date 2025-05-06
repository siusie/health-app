// pages/terms/index.js
import HomePageNavBar from "@/components/Navbar/HomePageNavBar";
import styles from "./terms.module.css";

const TermsOfService = () => {
  return (
    <div className={styles.container}>
      <HomePageNavBar variant="dark" />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Terms of Service</h1>
          <div className={styles.divider}></div>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using this application, you accept and agree to
              be bound by the terms and provisions of this agreement.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. User Account</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their
              account credentials and for all activities that occur under their
              account.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Privacy Policy</h2>
            <p>
              Our privacy policy explains how we collect, use, and protect your
              personal information. By using our service, you agree to our
              privacy policy.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Intellectual Property</h2>
            <p>
              All content, features, and functionality of this application are
              owned by us and are protected by international copyright,
              trademark, and other intellectual property laws.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Limitation of Liability</h2>
            <p>
              We shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages resulting from your use or
              inability to use the service.
            </p>
          </section>

          <section className={styles.section}>
            <p>
              If you have any questions about these Terms of Service,
              please&nbsp;
              <a href="mailto:info@tummytime.com" className={styles.link}>
                contact us
              </a>
              .
            </p>
          </section>
        </div>

        <footer className={styles.footer}>Last updated: April 3, 2025</footer>
      </main>
    </div>
  );
};

// Override the default Layout styling
TermsOfService.getLayout = function getLayout(page) {
  return <>{page}</>;
};

export default TermsOfService;
