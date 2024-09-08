export const currencies = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    NPR: "रु"
  } as const
  
  export type CurrencyCode = keyof typeof currencies
  
  export type TransactionType = 'income' | 'expense' | 'loan'
  
  export type Transaction = {
    id: string
    type: TransactionType
    amount: number
    remarks: string
    date: string
    userId: string
  }
  
  export type MonthData = {
    name: string
    expense: number
    income: number
    loan: number
  }
  
  export const generateYearData = (transactions: Transaction[], year: number): MonthData[] => {
    const monthData = Array.from({ length: 12 }, (_, i) => ({
      name: new Date(year, i).toLocaleString('default', { month: 'short', year: 'numeric' }),
      expense: 0,
      income: 0,
      loan: 0
    }));
  
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate.getFullYear() === year) {
        const month = transactionDate.getMonth();
        monthData[month][transaction.type] += transaction.amount;
      }
    });
  
    return monthData;
  }