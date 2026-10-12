<!-- rigenerato da scripts/repo-map.mjs nella skill flow-wise — non modificare a mano -->

# CODE_MAP — flow-wise-client

Indice file-per-file generato dal codice (non dalla documentazione). Serve a sapere **dove** sta
una cosa senza leggere il repo: architettura e limiti noti stanno altrove (vedi `AGENTS.md`).

Repo `client` — commit `2ec2334`.

```bash
node <skill flow-wise>/scripts/repo-map.mjs /Users/giocuo/Projects/flow-wise-client \
  --out /Users/giocuo/Projects/flow-wise-client/CODE_MAP.md
```

## app/ — route (App Router: il percorso della cartella e' l'URL)

| URL | File | Componente |
| --- | --- | --- |
| `/ai-beta` | `app/ai-beta/page.tsx` | `AiBetaPage` |
| `/budgets` | `app/budgets/page.tsx` | `Budgets` |
| `/category` | `app/category/page.tsx` | `Categories` |
| `/dashboard` | `app/dashboard/page.tsx` | `Dashboard` |
| `/expenses` | `app/expenses/page.tsx` | `Expenses` |
| `/forgot-password` | `app/forgot-password/page.tsx` | `ForgotPasswordPage` |
| `/incomes` | `app/incomes/page.tsx` | `Incomes` |
| `/login` | `app/login/page.tsx` | `LoginPage` |
| `/` | `app/page.tsx` | `Home` |
| `/privacy` | `app/privacy/page.tsx` | `PrivacyTerms` |
| `/register` | `app/register/page.tsx` | `RegisterPage` |
| `/reset-password` | `app/reset-password/page.tsx` | `ResetPasswordPage` |
| `/settings/import` | `app/settings/import/page.tsx` | `Import` |
| `/settings` | `app/settings/page.tsx` | `Settings` |
| `/settings/yourbank` | `app/settings/yourbank/page.tsx` | `YourBankWithSuspense` |
| `/wallets` | `app/wallets/page.tsx` | `Wallets` |

Layout: `app/layout.tsx`

File accanto alle pagine (non route):

- `app/flow-wise-logo.svg` — asset
- `app/globals.css` — stile
- `app/settings/yourbank/BankDrawer.tsx` — `BankDrawer`, `Institution`
- `app/settings/yourbank/ImportTransactionDialog.tsx` — `BankTransactionItem`, `ImportTransactionDialog`

## lib/

*lib/*
- `lib/amount.test.ts` — (nessun export)
- `lib/amount.ts` — fn `absoluteAmount`, `signedAmount`, `totalForType`
- `lib/amountInput.test.ts` — (nessun export)
- `lib/amountInput.ts` — const `AMOUNT_NEGATIVE_MESSAGE`, `AMOUNT_NOT_A_NUMBER_MESSAGE`; type `AmountInputCheck`; fn `checkAmountInput`
- `lib/api.ts` — fn `apiFetch`, `buildQuery`, `getAuthToken`
- `lib/constants.ts` — const `API_URL`
- `lib/httpError.ts` — fn `errorFromResponse`
- `lib/listResponse.test.ts` — (nessun export)
- `lib/listResponse.ts` — const `EMPTY_LIST_RESPONSE`; type `ListResponse`; fn `parseListResponse`
- `lib/supabaseClient.ts` — const `supabase`
- `lib/utils.ts` — fn `cn`
*lib/hooks/*
- `lib/hooks/useQueries.ts` — type `Category`, `Transaction`, `Wallet`, `WalletCreateInput`, `WalletUpdateInput`; const `queryKeys`; fn `useActiveCategories`, `useCategories`, `useCreateCategory`, `useCreateTransaction`, `useCreateWallet`, `useDashboardLayout`, `useDeleteCategory`, `useDeleteTransaction`, `useDeleteWallet`, `useExpenses`, `useImportCsv`, `useIncomes`, `useSaveDashboardLayout`, `useUpdateCategory`, `useUpdateTransaction`, `useUpdateWallet`, `useWallets`
*lib/providers/*
- `lib/providers/AuthProvider.tsx` — fn `AuthProvider`, `useAuth`
- `lib/providers/DateRangeProvider.tsx` — fn `DateRangeProvider`, `useDateRange`
- `lib/providers/QueryProvider.tsx` — fn `QueryProvider`
*lib/types/*
- `lib/types/dashboard.ts` — type `DashboardLayout`, `Widget`, `WidgetConfig`, `WidgetPosition`, `WidgetType`; const `DEFAULT_LAYOUT`, `GRID_COLS`, `GRID_ROWS`; fn `isValidPosition`

## components/

*components/*
- `components/category-dialog.tsx` — default `CategoryDialog`
- `components/date-picker.tsx` — default `DatePickerWithRange`
- `components/delete-dialog.tsx` — default `DeleteDialog`
- `components/dynamic-table.tsx` — fn `DynamicTable`
- `components/edit-dialog.tsx` — default `EditDialog`
- `components/loading-spinner.tsx` — default `LoadingSpinner`
- `components/login-form.tsx` — fn `LoginForm`
- `components/movements-list.tsx` — fn `MovementsList`; type `MovementsListProps`
- `components/nav-user.tsx` — fn `NavUser`
- `components/navbar.tsx` — default `Navbar`
- `components/new-transaction.tsx` — default `NewTransaction`
- `components/register-form.tsx` — fn `RegisterForm`
- `components/truncated-notice.tsx` — fn `TruncatedNotice`
*components/dashboard/*
- `components/dashboard/add-widget-dialog.tsx` — fn `AddWidgetDialog`
- `components/dashboard/dashboard-grid.tsx` — fn `DashboardGrid`
- `components/dashboard/draggable-widget.tsx` — fn `DraggableWidget`
- `components/dashboard/widget-renderer.tsx` — fn `WidgetRenderer`
*components/dashboard/widgets/*
- `components/dashboard/widgets/expense-breakdown-widget.tsx` — fn `ExpenseBreakdownWidget`
- `components/dashboard/widgets/income-vs-expenses-widget.tsx` — fn `IncomeVsExpensesWidget`
- `components/dashboard/widgets/period-expenses-widget.tsx` — fn `PeriodExpensesWidget`
- `components/dashboard/widgets/period-incomes-widget.tsx` — fn `PeriodIncomesWidget`
- `components/dashboard/widgets/total-balance-widget.tsx` — fn `TotalBalanceWidget`
*components/ui/*
- `components/ui/alert-dialog.tsx` — named `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger`
- `components/ui/alert.tsx` — named `Alert`, `AlertDescription`, `AlertTitle`
- `components/ui/avatar.tsx` — named `Avatar`, `AvatarFallback`, `AvatarImage`
- `components/ui/badge.tsx` — named `Badge`, `badgeVariants`; type `BadgeProps`
- `components/ui/button.tsx` — named `Button`, `buttonVariants`; type `ButtonProps`
- `components/ui/calendar.tsx` — named `Calendar`; type `CalendarProps`
- `components/ui/card.tsx` — named `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`
- `components/ui/chart.tsx` — type `ChartConfig`; named `ChartContainer`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`, `ChartTooltip`, `ChartTooltipContent`
- `components/ui/checkbox.tsx` — named `Checkbox`
- `components/ui/dialog.tsx` — named `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`
- `components/ui/drawer.tsx` — named `Drawer`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerPortal`, `DrawerTitle`, `DrawerTrigger`
- `components/ui/dropdown-menu.tsx` — named `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger`
- `components/ui/input.tsx` — named `Input`
- `components/ui/label.tsx` — named `Label`
- `components/ui/navigation-menu.tsx` — named `NavigationMenu`, `NavigationMenuContent`, `NavigationMenuIndicator`, `NavigationMenuItem`, `NavigationMenuLink`, `NavigationMenuList`, `NavigationMenuTrigger`, `navigationMenuTriggerStyle`, `NavigationMenuViewport`
- `components/ui/popover.tsx` — named `Popover`, `PopoverAnchor`, `PopoverContent`, `PopoverTrigger`
- `components/ui/radio-group.tsx` — named `RadioGroup`, `RadioGroupItem`
- `components/ui/scroll-area.tsx` — named `ScrollArea`, `ScrollBar`
- `components/ui/select.tsx` — named `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator`, `SelectTrigger`, `SelectValue`
- `components/ui/separator.tsx` — named `Separator`
- `components/ui/sheet.tsx` — named `Sheet`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetOverlay`, `SheetPortal`, `SheetTitle`, `SheetTrigger`
- `components/ui/sonner.tsx` — named `Toaster`
- `components/ui/switch.tsx` — named `Switch`
- `components/ui/table.tsx` — named `Table`, `TableBody`, `TableCaption`, `TableCell`, `TableFooter`, `TableHead`, `TableHeader`, `TableRow`
- `components/ui/tabs.tsx` — named `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `components/ui/textarea.tsx` — named `Textarea`
