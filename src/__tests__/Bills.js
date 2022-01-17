/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";
import store from "../__mocks__/store"
import { ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

const localStorage = () => { Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem(
  "user",
  JSON.stringify({
    type: "Employee",
  })
)}

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  // Added test for view/BillsUI.js //

  // Test for checking if loading page is returned when it's loading

  describe("When I am on Bills Page and it's loading", () => {
    test("Then it should return Loading Page", () => {
      const html = BillsUI({ loading: true });
      expect(html).toMatch(new RegExp("Loading..."));
    });
  });

  // Test for checking if erro page is returned when there's an error

  describe("When I am on Bills Page and there's an error", () => {
    test("Then it should return Error Page", () => {
      const html = BillsUI({ error: true });
      expect(html).toMatch(new RegExp("Erreur"));
    });
  });

  // Added test for containers/Bills.js //

  // Test for redirect on click button new Bill

  describe("When I am on Bills Page and I click on new bill", () => {
    test("it should redirect to new bills page", () => {
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const bills = new Bills({ document, onNavigate, store, localStorage });

      const handleClickNewBill = jest.fn(bills.handleClickNewBill);
      const buttonNewBill = screen.getByTestId("btn-new-bill");
      buttonNewBill.addEventListener("click", handleClickNewBill);
      fireEvent.click(buttonNewBill);

      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  });

  // Test for showing invoice when eye icon is clicked

  describe("When I am on Bills Page and I click on the eye icon", () => {
    test("it should show the invoice receipt", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const billsTest = new Bills({ document, onNavigate, store, localStorage });
      $.fn.modal = jest.fn();

      const icons = screen.getAllByTestId("icon-eye");
      icons.forEach((icon) => {
        const handleClickIconEye = jest.fn(() => billsTest.handleClickIconEye(icon));
        icon.addEventListener("click", handleClickIconEye);
        fireEvent.click(icon);
      });

      expect(screen.getByTestId("modalFile")).toBeVisible;
    })
  });
})

// Added integration test GET Bills

describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
       const getSpy = jest.spyOn(store, "get")
       const bills = await store.get()
       expect(getSpy).toHaveBeenCalledTimes(1)
       expect(bills.data.length).toBe(4)
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      store.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {
      store.get.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
