import React from "react";
import { Container, Row, Col, Nav } from "react-bootstrap";
import styles from "./Footer.module.css";

function Footer() {
  return (
    <Container className={styles.footer} fluid>
      {/* <Row className={`${styles.footerRow} py-3`}>
        <Col md={4}>
          <h5>About Us</h5>
          <p>Supporting parents and caregivers in their journey through parenthood.</p>
        </Col>
        <Col md={4}>
          <h5>Quick Links</h5>
          <ul className="list-unstyled">
            <li><Nav.Link href="/">Home</Nav.Link></li>
            <li><Nav.Link href="/resources">Resources</Nav.Link></li>
            <li><Nav.Link href="/contact">Contact</Nav.Link></li>
          </ul>
        </Col>
        <Col md={4}>
          <h5>Contact Info</h5>
          <ul className="list-unstyled">
            <li>Email: info@babypage.com</li>
            <li>Phone: (123) 456-7890</li>
          </ul>
        </Col>
      </Row> */}
      <Row className={`${styles.copyrightRow} py-2 border-top`}>
        <Col className="text-center">
          <small className="text-muted">
            &copy; {new Date().getFullYear()} Tummy Time. All rights reserved.
          </small>
        </Col>
      </Row>
    </Container>
  );
}

export default Footer;