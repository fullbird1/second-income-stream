import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Navigation = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <LinkContainer to="/">
          <Navbar.Brand>Second Income Stream</Navbar.Brand>
        </LinkContainer>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/" exact>
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/portfolio">
              <Nav.Link>Portfolio</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/stocks/1">
              <Nav.Link>Tier 1 Stocks</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/stocks/2">
              <Nav.Link>Tier 2 Stocks</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/stocks/3">
              <Nav.Link>Tier 3 Stocks</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/dividends">
              <Nav.Link>Dividend Tracker</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/currency">
              <Nav.Link>Currency Converter</Nav.Link>
            </LinkContainer>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
