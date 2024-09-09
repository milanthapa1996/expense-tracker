"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Wallet,
  DollarSign,
  LogIn,
  LogOut,
} from "lucide-react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  Timestamp,
} from "firebase/firestore";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { db, auth } from "@/app/firebase/config";
import {
  currencies,
  CurrencyCode,
  Transaction,
  TransactionType,
  MonthData,
  generateYearData,
} from "@/lib/types";
import Link from "next/link";
import Login from "./login/page";

// function LoginPage({ onLogin }: { onLogin: () => void }) {
//   const { toast } = useToast();

//   const handleLogin = async () => {
//     const provider = new GoogleAuthProvider();
//     try {
//       await signInWithPopup(auth, provider);
//       toast({
//         title: "Success",
//         description: "Logged in successfully",
//         className: "bg-white text-green-500",
//         variant: "default",
//       });
//       onLogin();
//     } catch (error) {
//       console.error("Login error:", error);
//       toast({
//         title: "Error",
//         description: "Failed to log in. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen bg-gray-100">
//       <Card className="w-[350px]">
//         <CardHeader>
//           <CardTitle className="text-2xl font-bold text-center">
//             Expense Tracker
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           <p className="text-center mb-4">
//             Please log in to access your dashboard
//           </p>
//           <Button onClick={handleLogin} className="w-full">
//             <LogIn className="mr-2 h-4 w-4" /> Login with Google
//           </Button>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

export default function ExpenseTracker() {
  const [amount, setAmount] = useState("");
  const [transactionType, setTransactionType] = useState<TransactionType | "">(
    ""
  );
  const [remarks, setRemarks] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentMonthIncome, setCurrentMonthIncome] = useState(0);
  const [currentMonthExpense, setCurrentMonthExpense] = useState(0);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearData, setYearData] = useState<MonthData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        loadTransactions(user.uid);
      } else {
        setTransactions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyIncome = transactions
      .filter(
        (t) =>
          t.type === "income" &&
          new Date(t.date).getMonth() === currentMonth &&
          new Date(t.date).getFullYear() === currentYear
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date).getMonth() === currentMonth &&
          new Date(t.date).getFullYear() === currentYear
      )
      .reduce((sum, t) => sum + t.amount, 0);

    setCurrentMonthIncome(monthlyIncome);
    setCurrentMonthExpense(monthlyExpense);
    setYearData(generateYearData(transactions, selectedYear));
  }, [transactions, selectedYear]);

  const loadTransactions = (userId: string) => {
    const q = query(
      collection(db, `users/${userId}/transactions`),
      orderBy("date", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const loadedTransactions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
      setTransactions(loadedTransactions);
    });

    return unsubscribe;
  };

  const addTransaction = async () => {
    if (!amount || !transactionType || !remarks || !user || !date) {
      toast({
        title: "Error",
        description: "Please fill in all fields and ensure you're logged in",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDoc(collection(db, `users/${user.uid}/transactions`), {
        type: transactionType,
        amount: parseFloat(amount),
        remarks,
        date,
        createdAt: Timestamp.now(),
      });

      setAmount("");
      setTransactionType("");
      setRemarks("");
      setDate(new Date().toISOString().split("T")[0]);

      toast({
        title: "Success",
        description: `${
          transactionType.charAt(0).toUpperCase() + transactionType.slice(1)
        } added successfully`,
        className: "bg-white text-green-500",
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    }
  };

  const totalSavings = transactions.reduce((acc, transaction) => {
    if (transaction.type === "income") return acc + transaction.amount;
    if (transaction.type === "expense") return acc - transaction.amount;
    return acc;
  }, 0);

  const totalLoan = transactions
    .filter((transaction) => transaction.type === "loan")
    .reduce((acc, transaction) => acc + transaction.amount, 0);

  const currentMonth = new Date().toLocaleString("default", { month: "short" });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Success",
        description: "Logged out successfully",
        className: "bg-white text-green-500",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <Login/>
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg overflow-hidden relative">
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Expense Tracker</h1>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                <CardTitle className="text-xs font-medium">
                  Total Savings
                </CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-lg font-bold">
                  {currencies[currency]}
                  {totalSavings.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                <CardTitle className="text-xs font-medium">
                  Total Loans
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-lg font-bold">
                  {currencies[currency]}
                  {totalLoan.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                <CardTitle className="text-xs font-medium">
                  {currentMonth} Income
                </CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-sm font-bold">
                  {currencies[currency]}
                  {currentMonthIncome.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                <CardTitle className="text-xs font-medium">
                  {currentMonth} Expense
                </CardTitle>
                <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-2">
                <div className="text-sm font-bold">
                  {currencies[currency]}
                  {currentMonthExpense.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between p-2">
              <CardTitle className="text-sm">Expense Overview</CardTitle>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[80px] h-8 text-xs">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearData}>
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `${currencies[currency]}${value}`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #ccc",
                        fontSize: "0.7rem",
                      }}
                      formatter={(value, name) => [
                        `${currencies[currency]}${value}`,
                        name,
                      ]}
                    />
                    <Bar
                      dataKey="expense"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="income"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar dataKey="loan" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Add Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-2">
                <Label htmlFor="transaction-type" className="text-xs">
                  Type
                </Label>
                <Select
                  value={transactionType}
                  onValueChange={(value: TransactionType) =>
                    setTransactionType(value)
                  }
                >
                  <SelectTrigger id="transaction-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount" className="text-xs">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="remarks" className="text-xs">
                  Remarks
                </Label>
                <Input
                  id="remarks"
                  placeholder="Enter remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date" className="text-xs">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full text-sm" onClick={addTransaction}>
                Add Transaction
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Recent Transactions
                <Link
                  href="/transactions"
                  className="text-xs font-medium text-muted-foreground hover:text-primary float-right"
                >
                  View All
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 5).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center text-xs"
                  >
                    <div
                      className={`mr-2 ${
                        transaction.type === "income"
                          ? "text-green-500"
                          : transaction.type === "expense"
                          ? "text-red-500"
                          : "text-blue-500"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUpCircle className="h-3 w-3" />
                      ) : transaction.type === "expense" ? (
                        <ArrowDownCircle className="h-3 w-3" />
                      ) : (
                        <Wallet className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{transaction.remarks}</p>
                      <p className="text-gray-500">{transaction.date}</p>
                    </div>
                    <p
                      className={`font-medium ${
                        transaction.type === "income"
                          ? "text-green-500"
                          : transaction.type === "expense"
                          ? "text-red-500"
                          : "text-blue-500"
                      }`}
                    >
                      {transaction.type === "income"
                        ? "+"
                        : transaction.type === "expense"
                        ? "-"
                        : ""}
                      {currencies[currency]}
                      {transaction.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="fixed bottom-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-12 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <DollarSign className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(currencies) as CurrencyCode[]).map((curr) => (
                <DropdownMenuItem key={curr} onClick={() => setCurrency(curr)}>
                  {curr} ({currencies[curr]})
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
