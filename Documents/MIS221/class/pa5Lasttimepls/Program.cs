using pa5Lasttimepls;

//Create array of Pizzas, Drinks, and Orders
Pizza[] pizzas = new Pizza[100];
Drink[] drinks = new Drink[100];
Order[] orders = new Order[1000];

//Instatntiate ultility and report objects
PizzaFile pizzaFile = new PizzaFile(pizzas);
PizzaUtility pizzaUtility = new PizzaUtility(pizzas);

DrinkFile drinkFile = new DrinkFile(drinks);
DrinkUtility drinkUtility = new DrinkUtility(drinks);

OrderFile orderFile = new OrderFile(orders);
OrderUtility orderUtility = new OrderUtility(orders);

Report report = new Report(pizzas, drinks, orders);


// Main Menu Loop
string userChoice = "";
string customerChoice = "";
string managerChoice = "";
string reportChoice = "";

do 
{
    userChoice = GetMenuChoice();
    RouteEm(orders, pizzas, drinks, pizzaFile, orderFile, drinkFile, pizzaUtility, orderUtility, drinkUtility, report, userChoice,ref managerChoice, ref customerChoice, ref reportChoice);
} while (userChoice != "4");


// Main Menu
static string GetMenuChoice()
{
    Console.WriteLine("---Papa's Pizzeria---");
    Console.WriteLine("1. Customer Functions");
    Console.WriteLine("2. Manager Functions");
    Console.WriteLine("3. About us Page");
    Console.WriteLine("4. Exit");
    Console.Write("Enter your choice (1-4): ");
    return Console.ReadLine();
}

// Route to Manager or Customer
static void RouteEm(Order[] orders, Pizza[] pizzas, Drink[] drinks, PizzaFile pizzaFile, OrderFile orderFile, DrinkFile drinkFile, PizzaUtility pizzaUtility, OrderUtility orderUtility, DrinkUtility drinkUtility, Report report, string userChoice, ref string managerChoice, ref string customerChoice, ref string reportChoice)
{
    switch(userChoice)
    {
        case "1":
            do
            {
                customerChoice = DisplayCustomerMenu();
                RouteCustomerChoice(orderFile, drinkFile, drinkUtility, pizzaUtility, orderUtility, pizzaFile, customerChoice);
            } while (customerChoice != "5");
            break;

        case "2":
            Console.Write("Enter manager code: ");
            string code = Console.ReadLine();
            if (code == "1234")
            {
                do
                {
                    managerChoice = DisplayManagerMenu();
                    RouteManagerChoice(orders, orderFile, orderUtility, pizzaUtility, pizzaFile, drinkUtility, drinkFile, report, managerChoice, ref reportChoice);
                } while (managerChoice != "5");
            }
            else
            {
                Console.WriteLine("Incorrect code. Returning to main menu...\n");
            }
            break;
        case "3":
            Console.WriteLine("\n--- About Papa's Pizzeria ---");
            Console.WriteLine("At Papa's Pizzeria, we've been crafting mouthwatering pizzas since 1995.");
            Console.WriteLine("We use only the freshest ingredients and bake each pie to perfection.");
            Console.WriteLine("Our goal? To bring families and friends together over great food.");
            Console.WriteLine("Thanks for choosing Papa's. We appreciate you!\n");
            break;
        case "4":
            Console.WriteLine("Exiting the program... Goodbye!");
            break;

        default:
            Console.WriteLine("Invalid selection, please try again.");
            break;
    }
}


// Customer Menu
static string DisplayCustomerMenu()
{
    Console.WriteLine("\nCustomer Functions Menu");
    Console.WriteLine("1. View Available Pizzas");
    Console.WriteLine("2. View Available Drinks");
    Console.WriteLine("3. Place an order");
    Console.WriteLine("4. View past orders");
    Console.WriteLine("5. Return to main menu");
    Console.Write("Enter your choice: ");
    return Console.ReadLine();
}

// Manager Menu
static string DisplayManagerMenu()
{
    Console.WriteLine("\nManager Functions Menu");
    Console.WriteLine("1. Pizza functions");
    Console.WriteLine("2. Drink functions");
    Console.WriteLine("3. Mark order as complete");
    Console.WriteLine("4. Access report menu");
    Console.WriteLine("5. Return to main menu");
    Console.Write("Enter your choice: ");
    return Console.ReadLine();
}

// Pizza Submenu
static string DisplayPizzaMenu()
{
    Console.WriteLine("\nPizza Functions Menu");
    Console.WriteLine("1. Add new pizza");
    Console.WriteLine("2. Remove pizza");
    Console.WriteLine("3. Edit pizza information");
    Console.WriteLine("4. Return to manager menu");
    Console.Write("Enter your choice: ");
    return Console.ReadLine();
}

// Drink Submenu
static string DisplayDrinkMenu()
{
    Console.WriteLine("\nDrink Functions Menu");
    Console.WriteLine("1. Add new drink");
    Console.WriteLine("2. Remove drink");
    Console.WriteLine("3. Edit drink information");
    Console.WriteLine("4. Return to manager menu");
    Console.Write("Enter your choice: ");
    return Console.ReadLine();
}

// Report Submenu
static string DisplayReportMenu()
{
    Console.WriteLine("\nReport Functions Menu");
    Console.WriteLine("1. Daily pizza orders report");
    Console.WriteLine("2. Orders in progress");
    Console.WriteLine("3. Average pizza size by crust");
    Console.WriteLine("4. Top 5 most popular pizzas");
    Console.WriteLine("5. Top 3 most popular drinks");
    Console.WriteLine("6. Removed pizzas report");
    Console.WriteLine("7. Removed drinks report");
    Console.WriteLine("8. Sold out pizzas report");
    Console.WriteLine("9. Sold out drinks report");
    Console.WriteLine("10. Orders above $$ report");
    Console.WriteLine("11. Sort customers based on most spent");
    Console.WriteLine("12. Sort crust types based on most ordered to least ordered");
    Console.WriteLine("13. Sort pizza sizes based on most ordered to least ordered");
    Console.WriteLine("14. Sort drink sizes based on most ordered to least ordered");
    Console.WriteLine("15. Return to Manager Menu");
    Console.Write("Enter your choice: ");
    return Console.ReadLine();
}

// These are switch methods that route based on the user's menu selections

static void RouteCustomerChoice(OrderFile orderFile, DrinkFile drinkFile, DrinkUtility drinkUtility, PizzaUtility pizzaUtility, OrderUtility orderUtility, PizzaFile pizzaFile, string customerChoice) {
    switch (customerChoice) {
        case "1":
            pizzaUtility.ViewAvailablePizzas(pizzaFile);
            break;
        case "2":
            drinkUtility.ViewAvailableDrinks(drinkFile);
            break;
        case "3":
            orderUtility.PlaceOrder(orderFile, pizzaFile, drinkFile);
            break;
        case "4":
            orderUtility.ViewPastOrders(orderFile);
            break;
        case "5":
            Console.WriteLine("Returning to main menu....\n\n");
            break;
        default:
            Console.WriteLine("Invalid selection. Please try again.");
            break;
    }
}

static void RouteManagerChoice(Order[] orders, OrderFile orderFile, OrderUtility orderUtility, PizzaUtility pizzaUtility, PizzaFile pizzaFile, DrinkUtility drinkUtility, DrinkFile drinkFile, Report report, string managerChoice, ref string reportChoice) {
    switch (managerChoice) {
        case "1":
            string pizzaMenuChoice = DisplayPizzaMenu();
            RoutePizzaMenu(pizzaUtility, pizzaFile, pizzaMenuChoice);
            break;
        case "2":
            string drinkMenuChoice = DisplayDrinkMenu();
            RouteDrinkMenu(drinkUtility, drinkFile, drinkMenuChoice);
            break;
        case "3":
            orderUtility.MarkOrderAsComplete(orderFile);
            break;
        case "4":
            do {
                reportChoice = DisplayReportMenu();
                RouteReportMenu(report, orderFile, pizzaFile, drinkFile, reportChoice);
            } while (reportChoice != "15");
            break;
        case "5":
            Console.WriteLine("Returning to main menu...\n\n");
            break;
        default:
            Console.WriteLine("Invalid selection. Please try again.");
            break;
    }
}

static void RoutePizzaMenu(PizzaUtility pizzaUtility, PizzaFile pizzaFile, string pizzaMenuChoice) {
    switch (pizzaMenuChoice) {
        case "1":
            pizzaUtility.AddPizza(pizzaFile);
            break;
        case "2":
            pizzaUtility.RemovePizza(pizzaFile);
            break;
        case "3":
            pizzaUtility.EditPizza(pizzaFile);
            break;
        case "4":
            Console.WriteLine("Returning to manager menu...");
            break;
        default:
            Console.WriteLine("Invalid selection. Please try again.");
            break;
    }
}

static void RouteDrinkMenu(DrinkUtility drinkUtility, DrinkFile drinkFile, string drinkMenuChoice) {
    switch (drinkMenuChoice) {
        case "1":
            drinkUtility.AddDrink(drinkFile);
            break;
        case "2":
            drinkUtility.RemoveDrink(drinkFile);
            break;
        case "3":
            drinkUtility.EditDrink(drinkFile);
            break;
        case "4":
            Console.WriteLine("Returning to manager menu...");
            break;
        default:
            Console.WriteLine("Invalid selection. Please try again.");
            break;
    }
}

static void RouteReportMenu(Report report, OrderFile orderFile, PizzaFile pizzaFile, DrinkFile drinkFile, string reportChoice) {
    switch (reportChoice){
        case "1": 
            report.DailyOrdersReport(orderFile); 
            break;
        case "2": 
            report.OrdersInProgressReport(orderFile); 
            break;
        case "3": 
            report.AverageSizeByCrust(orderFile, pizzaFile); 
            break;
        case "4": 
            report.TopFivePizzas(orderFile, pizzaFile); 
            break;
        case "5":   
            report.TopThreeMostPopularDrinks(orderFile, drinkFile); 
                break;
        case "6": 
            report.RemovedPizzasReport(pizzaFile); 
            break;
        case "7": 
            report.ReportRemovedDrinks(drinkFile); 
            break;
        case "8":
            report.ReportSoldOutPizzas(pizzaFile); 
            break;
        case "9": 
            report.ReportSoldOutDrinks(drinkFile); 
            break;
        case "10": 
            report.ReportOrdersAbovePrice(orderFile, pizzaFile, drinkFile); 
            break;
        case "11": 
            report.CustomerSpendingReport(orderFile, pizzaFile, drinkFile); 
            break;
        case "12": 
            report.MostOrderedCrustTypesReport(orderFile, pizzaFile); 
            break;
        case "13": 
            report.SortPizzaSizesByPopularity(orderFile); 
            break;
        case "14": 
            report.SortDrinkSizesByPopularity(orderFile); 
            break;
        case "15": 
            Console.WriteLine("Returning to manager menu..."); 
            break;
        default: 
            Console.WriteLine("Invalid selection. Please try again."); 
            break;
    }
}


//add pizza
//pizzaUtility.AddPizza(pizzaFile);

//remove pizza
// pizzaUtility.RemovePizza(pizzaFile);

//edit pizza
// pizzaUtility.EditPizza(pizzaFile);

//View available pizzas
//pizzaUtility.ViewAvailablePizzas(pizzaFile);


//add drink
//drinkUtility.AddDrink(drinkFile);

//remove drink
//drinkUtility.RemoveDrink(drinkFile);

//edit drink
//drinkUtility.EditDrink(drinkFile);

//View available drinks
//drinkUtility.ViewAvailableDrinks(drinkFile);


//Mark order as complete
//orderUtility.MarkOrderAsComplete(orderFile);

//Place an order
//orderUtility.PlaceOrder(orderFile);

//view past order
//orderUtility.ViewPastOrders(orderFile);

//daily orders report
//report.DailyOrdersReport(orderFile);

//Average pizza size by crust
//report.AverageSizeByCrust(orderFile, pizzaFile);

//Orders in progress report
//report.OrdersInProgressReport(orderFile);

//Top 5 Pizzas report
//report.TopFivePizzas(orderFile, pizzaFile);

//Top 3 Drinks report
//report.TopThreeMostPopularDrinks(orderFile, drinkFile);

//Removed Pizzas report
//report.RemovedPizzasReport(pizzaFile);

//Sold Out Drinks report
//report.ReportSoldOutDrinks(drinkFile);

//Sold Out Pizzas report
//report.ReportSoldOutPizzas(pizzaFile);

//Removed Drinks Report
//report.ReportRemovedDrinks(drinkFile);

//Order above $$ amount report
//report.ReportOrdersAbovePrice(orderFile, pizzaFile, drinkFile);

//Most Spent Customer Sort Report based off email
//report.CustomerSpendingReport(orderFile, pizzaFile, drinkFile);

//Sort Most ordered Crust Types to Least Report
//report.MostOrderedCrustTypesReport(orderFile, pizzaFile);

//Sort most ordered pizza sizes to least report
//report.SortPizzaSizesByPopularity(orderFile);

//Sort most ordered drink sizes to least report
//report.SortDrinkSizesByPopularity(orderFile);

