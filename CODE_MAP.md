<!-- rigenerato da scripts/repo-map.mjs nella skill repo-context-and-maps — non modificare a mano -->

# CODE_MAP — flow-wise-client

Indice file-per-file generato dal codice, non dalla documentazione. Serve a sapere **dove** sta una
cosa senza leggere il repo: architettura e regole locali stanno altrove (vedi `AGENTS.md`).

Forma `next`, radice sorgente `.`, commit `efe242a`.

```bash
node <skill repo-context-and-maps>/scripts/repo-map.mjs /Users/giocuo/Projects/flow-wise-client \
  --out /Users/giocuo/Projects/flow-wise-client/CODE_MAP.md
```

## app/ — route (App Router: il percorso della cartella è l'URL)

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

*app/*
- `app/flow-wise-logo.svg` — asset
- `app/globals.css` — stile
*app/settings/yourbank/*
- `app/settings/yourbank/BankDrawer.tsx` — exports: default `BankDrawer`; type `Institution`
- `app/settings/yourbank/ImportTransactionDialog.tsx` — exports: type `BankTransactionItem`; default `ImportTransactionDialog`

## .claude/

*.claude/*
- `.claude/settings.json` — dati

## .githooks/

*.githooks/*
- `.githooks/pre-push`

## components/

*components/*
- `components/category-dialog.tsx` — exports: default `CategoryDialog`
- `components/date-picker.tsx` — exports: default `DatePickerWithRange`
- `components/delete-dialog.tsx` — exports: default `DeleteDialog`
- `components/dynamic-table.tsx` — exports: fn `DynamicTable`
- `components/edit-dialog.tsx` — exports: default `EditDialog`
- `components/loading-spinner.tsx` — exports: default `LoadingSpinner`
- `components/login-form.tsx` — exports: fn `LoginForm`
- `components/movements-list.tsx` — exports: fn `MovementsList`; type `MovementsListProps`
- `components/nav-user.tsx` — exports: fn `NavUser`
- `components/navbar.tsx` — exports: default `Navbar`
- `components/new-transaction.tsx` — exports: default `NewTransaction`
- `components/register-form.tsx` — exports: fn `RegisterForm`
- `components/truncated-notice.tsx` — exports: fn `TruncatedNotice`

## components/dashboard/

*components/dashboard/*
- `components/dashboard/add-widget-dialog.tsx` — exports: fn `AddWidgetDialog`
- `components/dashboard/dashboard-grid.tsx` — exports: fn `DashboardGrid`
- `components/dashboard/draggable-widget.tsx` — exports: fn `DraggableWidget`
- `components/dashboard/widget-renderer.tsx` — exports: fn `WidgetRenderer`
*components/dashboard/widgets/*
- `components/dashboard/widgets/expense-breakdown-widget.tsx` — exports: fn `ExpenseBreakdownWidget`
- `components/dashboard/widgets/income-vs-expenses-widget.tsx` — exports: fn `IncomeVsExpensesWidget`
- `components/dashboard/widgets/period-expenses-widget.tsx` — exports: fn `PeriodExpensesWidget`
- `components/dashboard/widgets/period-incomes-widget.tsx` — exports: fn `PeriodIncomesWidget`
- `components/dashboard/widgets/total-balance-widget.tsx` — exports: fn `TotalBalanceWidget`

## components/ui/

*components/ui/*
- `components/ui/alert-dialog.tsx` — exports: named `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogOverlay`, `AlertDialogPortal`, `AlertDialogTitle`, `AlertDialogTrigger`
- `components/ui/alert.tsx` — exports: named `Alert`, `AlertDescription`, `AlertTitle`
- `components/ui/avatar.tsx` — exports: named `Avatar`, `AvatarFallback`, `AvatarImage`
- `components/ui/badge.tsx` — exports: named `Badge`, `badgeVariants`; type `BadgeProps`
- `components/ui/button.tsx` — exports: named `Button`, `buttonVariants`; type `ButtonProps`
- `components/ui/calendar.tsx` — exports: named `Calendar`; type `CalendarProps`
- `components/ui/card.tsx` — exports: named `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`
- `components/ui/chart.tsx` — exports: type `ChartConfig`; named `ChartContainer`, `ChartLegend`, `ChartLegendContent`, `ChartStyle`, `ChartTooltip`, `ChartTooltipContent`
- `components/ui/checkbox.tsx` — exports: named `Checkbox`
- `components/ui/dialog.tsx` — exports: named `Dialog`, `DialogClose`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogOverlay`, `DialogPortal`, `DialogTitle`, `DialogTrigger`
- `components/ui/drawer.tsx` — exports: named `Drawer`, `DrawerClose`, `DrawerContent`, `DrawerDescription`, `DrawerFooter`, `DrawerHeader`, `DrawerOverlay`, `DrawerPortal`, `DrawerTitle`, `DrawerTrigger`
- `components/ui/dropdown-menu.tsx` — exports: named `DropdownMenu`, `DropdownMenuCheckboxItem`, `DropdownMenuContent`, `DropdownMenuGroup`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuPortal`, `DropdownMenuRadioGroup`, `DropdownMenuRadioItem`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger`, `DropdownMenuTrigger`
- `components/ui/input.tsx` — exports: named `Input`
- `components/ui/label.tsx` — exports: named `Label`
- `components/ui/navigation-menu.tsx` — exports: named `NavigationMenu`, `NavigationMenuContent`, `NavigationMenuIndicator`, `NavigationMenuItem`, `NavigationMenuLink`, `NavigationMenuList`, `NavigationMenuTrigger`, `navigationMenuTriggerStyle`, `NavigationMenuViewport`
- `components/ui/popover.tsx` — exports: named `Popover`, `PopoverAnchor`, `PopoverContent`, `PopoverTrigger`
- `components/ui/radio-group.tsx` — exports: named `RadioGroup`, `RadioGroupItem`
- `components/ui/scroll-area.tsx` — exports: named `ScrollArea`, `ScrollBar`
- `components/ui/select.tsx` — exports: named `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectLabel`, `SelectScrollDownButton`, `SelectScrollUpButton`, `SelectSeparator`, `SelectTrigger`, `SelectValue`
- `components/ui/separator.tsx` — exports: named `Separator`
- `components/ui/sheet.tsx` — exports: named `Sheet`, `SheetClose`, `SheetContent`, `SheetDescription`, `SheetFooter`, `SheetHeader`, `SheetOverlay`, `SheetPortal`, `SheetTitle`, `SheetTrigger`
- `components/ui/sonner.tsx` — exports: named `Toaster`
- `components/ui/switch.tsx` — exports: named `Switch`
- `components/ui/table.tsx` — exports: named `Table`, `TableBody`, `TableCaption`, `TableCell`, `TableFooter`, `TableHead`, `TableHeader`, `TableRow`
- `components/ui/tabs.tsx` — exports: named `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `components/ui/textarea.tsx` — exports: named `Textarea`

## lib/

*lib/*
- `lib/amount.test.ts`
- `lib/amount.ts` — exports: fn `absoluteAmount`, `signedAmount`, `totalForType`
- `lib/amountInput.test.ts`
- `lib/amountInput.ts` — exports: const `AMOUNT_NEGATIVE_MESSAGE`, `AMOUNT_NOT_A_NUMBER_MESSAGE`; type `AmountInputCheck`; fn `checkAmountInput`
- `lib/api.ts` — exports: fn `apiFetch`, `buildQuery`, `getAuthToken`
- `lib/constants.ts` — exports: const `API_URL`
- `lib/httpError.ts` — exports: fn `errorFromResponse`
- `lib/listResponse.test.ts`
- `lib/listResponse.ts` — exports: const `EMPTY_LIST_RESPONSE`; type `ListResponse`; fn `parseListResponse`
- `lib/supabaseClient.ts` — exports: const `supabase`
- `lib/utils.ts` — exports: fn `cn`

## lib/hooks/

*lib/hooks/*
- `lib/hooks/useQueries.ts` — exports: type `Category`, `Transaction`, `Wallet`, `WalletCreateInput`, `WalletUpdateInput`; const `queryKeys`; fn `useActiveCategories`, `useCategories`, `useCreateCategory`, `useCreateTransaction`, `useCreateWallet`, `useDashboardLayout`, `useDeleteCategory`, `useDeleteTransaction`, `useDeleteWallet`, `useExpenses`, `useImportCsv`, `useIncomes`, `useSaveDashboardLayout`, `useUpdateCategory`, `useUpdateTransaction`, `useUpdateWallet`, `useWallets`

## lib/providers/

*lib/providers/*
- `lib/providers/AuthProvider.tsx` — exports: fn `AuthProvider`, `useAuth`
- `lib/providers/DateRangeProvider.tsx` — exports: fn `DateRangeProvider`, `useDateRange`
- `lib/providers/QueryProvider.tsx` — exports: fn `QueryProvider`

## lib/types/

*lib/types/*
- `lib/types/dashboard.ts` — exports: type `DashboardLayout`, `Widget`, `WidgetConfig`, `WidgetPosition`, `WidgetType`; const `DEFAULT_LAYOUT`, `GRID_COLS`, `GRID_ROWS`; fn `isValidPosition`

## public/

*public/*
- `public/apple-touch-icon.png` — asset
- `public/favicon-96x96.png` — asset
- `public/favicon.ico` — asset
- `public/favicon.svg` — asset
- `public/flow-wise-logo.svg` — asset
- `public/site.webmanifest`
- `public/web-app-manifest-192x192.png` — asset
- `public/web-app-manifest-512x512.png` — asset
