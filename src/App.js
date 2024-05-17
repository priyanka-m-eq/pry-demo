import { useQuery } from "react-query";
import { create } from "zustand";
import CustomAutoComplete from "./autoComplete";

const useStore = create((set) => ({
  code: "",
  totalValue: "",
  setCode: (value) => set({ code: value }),
  resetTotalValue: () => set({ totalValue: "" }),
  onChangeTotalValue: (value) => set({ totalValue: value }),
}));

function App() {
  const { code, setCode } = useStore();

  const { isLoading, error, data } = useQuery("fetchData", () =>
    fetch("https://652f91320b8d8ddac0b2b62b.mockapi.io/autocomplete").then(
      (res) => res.json()
    )
  );
  if (isLoading) return "Loading...";
  if (error) return "An error has occurred: " + error.message;

  return (
    <div className="App-view">
      <h1>Welcome to auto complete input text.</h1>
      <div className="input-view">
        <CustomAutoComplete
          code={code}
          setCode={setCode}
          dataList={data?.map((item) => item?.name.replace(" ", "-"))}
        />
      </div>
    </div>
  );
}

export default App;
