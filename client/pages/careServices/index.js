// client/pages/careServices/index.js
import React from "react";
import Head from "next/head";
import { ProviderContextProvider } from "../../context/ProviderContext";
import ProviderFinder from "../../components/ChildcareProviders/ProviderFinder";
import styles from "./careServices.module.css";

/**
 * CareServices page - Main page for childcare provider listings
 * @returns {JSX.Element} CareServices page
 */
export default function CareServices() {
  return (
    <div className={styles.pageWrapper}>
      <Head>
        <title>Find Childcare Services | Tummy Time</title>
        <meta 
          name="description" 
          content="Find trusted childcare providers including nannies, babysitters, and daycare services in your area." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <ProviderContextProvider>
        <ProviderFinder />
      </ProviderContextProvider>
      
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>© 2025 Tummy Time. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
