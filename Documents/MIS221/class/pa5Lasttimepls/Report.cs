using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace pa5Lasttimepls
{
    public class Report
    {
        private Pizza[] pizzas;
        private Drink[] drinks;
        private Order[] orders;
        
        //Constructor
        public Report(Pizza[] pizzas, Drink[] drinks, Order[] orders){
            this.pizzas = pizzas;
            this.drinks = drinks;
            this.orders = orders;
        }

        //Other methods

        // //This method gives a report of all the orders sorted by orderDate
        public void DailyOrdersReport(OrderFile orderFile){
            // Load existing orders
            Order[] orders = orderFile.GetAllOrders();

            // bubble sort by orderDate 
            for (int i = 0; i < Order.GetCount() - 1; i++)
            {
                for (int j = i + 1; j < Order.GetCount(); j++)
                {
                    string date1 = orders[i].GetOrderDate();
                    string date2 = orders[j].GetOrderDate();

                    // Swap to sort by oldest to newest — reverse the comparison for newest first
                    if (date1.CompareTo(date2) > 0)
                    {
                        Order temp = orders[i];
                        orders[i] = orders[j];
                        orders[j] = temp;
                    }
                }
            }

            // Print the sorted orders
            Console.WriteLine("\n--- Daily Orders Report ---\n");
            for (int i = 0; i < Order.GetCount(); i++)
            {
                Console.WriteLine(orders[i].ToString());
            }
        }    
        public void AverageSizeByCrust(OrderFile orderFile, PizzaFile pizzaFile){
            Order[] orders = orderFile.GetAllOrders();
            Pizza[] pizzas = pizzaFile.GetAllPizzas();
            int thinTotal = 0;
            int thickTotal = 0;
            int stuffedTotal = 0;
            int glutenFreeTotal = 0;

            int thinCount = 0;
            int thickCount = 0;
            int stuffedCount = 0;
            int glutenFreeCount = 0;

            for(int i = 0; i < Order.GetCount(); i++){
                int orderPizzaID = orders[i].GetPizzaID();
                int orderSize = orders[i].GetPizzaSize();

                for(int j = 0; j < Pizza.GetCount(); j++){
                    if(pizzas[j].GetPizzaID() == orderPizzaID){
                        string crust = pizzas[j].GetCrustType();
                        //see if I can figure out control break logic
                        if(crust == "Thin"){
                            thinTotal += orderSize;
                            thinCount++;
                        }
                        else if(crust == "Thick"){
                            thickTotal += orderSize;
                            thickCount++;
                        }
                        else if(crust == "Stuffed"){
                            stuffedTotal += orderSize;
                            stuffedCount++;
                        }
                        else{ //Gluten-Free
                            glutenFreeTotal += orderSize;
                            glutenFreeCount++;
                        }
                    }
                }
                
            }
            Console.WriteLine($"Average Pizza Size by Crust Type:");
            if(thinCount > 0){
                Console.WriteLine($"Thin Crust: {thinTotal/thinCount} inches");
            }
            else{
                Console.WriteLine("Thin Crust: No data");
            }
            if(thickCount > 0){
                Console.WriteLine($"\nThick Crust: {thickTotal/thickCount} inches");
            }
            else{
                Console.WriteLine("Thick Crust: No data");
            }
            if(stuffedCount > 0){
                Console.WriteLine($"\nStuffed Crust: {stuffedTotal/stuffedCount} inches");
            }
            else{
                Console.WriteLine("Stuffed Crust: No data");
            }  
            if(glutenFreeCount > 0){
                Console.WriteLine($"\nGluten-Free: {glutenFreeTotal/glutenFreeCount} inches");
            }
            else{
                Console.WriteLine("Gluten-Free Crust: No data");
            }

        }

        //This method allows for the manager to see a report of all orders in progress
        public void OrdersInProgressReport(OrderFile orderFile){
            // Load existing orders
            Order[] orders = orderFile.GetAllOrders();

            
            Console.WriteLine("\n--- Orders in Progress Report ---\n");

           
            bool hasOrdersInProgress = false;

            // Loop through all orders and find those that are in progress (false)
            for (int i = 0; i < Order.GetCount(); i++)
            {
                if (orders[i].GetOrderStatus() == false) 
                {
                    hasOrdersInProgress = true;
                    Console.WriteLine(orders[i].ToString()); // Display order details
                }
            }

            // If there were no orders in progress, display a message
            if (hasOrdersInProgress == false)
            {
                Console.WriteLine("No orders in progress.");
            }
        }
        public void TopFivePizzas(OrderFile orderFile, PizzaFile pizzaFile){
            Order[] orders = orderFile.GetAllOrders();
            Pizza[] pizzas = pizzaFile.GetAllPizzas();
            int[] pizzaIDs = new int[Pizza.GetCount()];
            int[] orderCounts = new int[Pizza.GetCount()];

            for(int i = 0; i < Pizza.GetCount(); i++){
                pizzaIDs[i] = pizzas[i].GetPizzaID();
                orderCounts[i] = 0;
            }
            for(int i = 0; i < Order.GetCount(); i++){
                int curr = orders[i].GetPizzaID();
                for(int j = 0; j < Pizza.GetCount(); j++){
                    if(pizzaIDs[j] == curr){
                        orderCounts[j]++;
                        break; 
                    }
                }
            }
            for(int i = 0; i < Pizza.GetCount() -1; i++){
                int maxIndex = i;
                for(int j = i + 1; j < Pizza.GetCount(); j++){
                    if(orderCounts[j] > orderCounts[maxIndex]){
                        maxIndex = j;
                    }

                }
                if(maxIndex != i){
                    int tempCount = orderCounts[i];
                    orderCounts[i] = orderCounts[maxIndex];
                    orderCounts[maxIndex] = tempCount;

                    int tempID = pizzaIDs[i];
                    pizzaIDs[i] = pizzaIDs[maxIndex];
                    pizzaIDs[maxIndex] = tempID;
                }
            }
          
            Console.WriteLine("Top 5 Popular Pizzas: ");
            for(int i = 0; i < 5; i++){
                string pizzaName = "";
                for(int j = 0; j < Pizza.GetCount(); j++){
                    if(pizzas[j].GetPizzaID() == pizzaIDs[i]){
                        pizzaName = pizzas[j].GetPizzaName();
                    }
                }
                Console.WriteLine($"{i + 1}.{pizzaName}");
            }

        }

        //This method allows the user to see a report of the top 3 most popular drinks
        public void TopThreeMostPopularDrinks(OrderFile orderFile, DrinkFile drinkFile){
            // Load all orders and drinks
            Order[] orders = orderFile.GetAllOrders();
            Drink[] drinks = drinkFile.GetAllDrinks();

            // Array to store how many times each drinkID was ordered
            int[] drinkOrderCounts = new int[Drink.GetCount()];

            // Count how many times each drink is ordered (ignoring ID 0)
            for (int i = 0; i < Order.GetCount(); i++)
            {
                int drinkID = orders[i].GetDrinkID();
                if (drinkID != 0)
                {
                    drinkOrderCounts[drinkID - 1]++; // subtract 1 for 0-based index
                }
            }

            // Sort drinkOrderCounts in descending order, and swap drinks accordingly
            for (int i = 0; i < Drink.GetCount() - 1; i++)
            {
                for (int j = i + 1; j < Drink.GetCount(); j++)
                {
                    if (drinkOrderCounts[i] < drinkOrderCounts[j])
                    {
                        // Swap counts
                        int tempCount = drinkOrderCounts[i];
                        drinkOrderCounts[i] = drinkOrderCounts[j];
                        drinkOrderCounts[j] = tempCount;

                        // Swap drink objects to match
                        Drink tempDrink = drinks[i];
                        drinks[i] = drinks[j];
                        drinks[j] = tempDrink;
                    }
                }
            }

            // Display the top 3 most popular drinks
            Console.WriteLine("\n--- Top 3 Most Popular Drinks ---\n");
            int topCount = Math.Min(3, Drink.GetCount());

            for (int i = 0; i < topCount; i++)
            {
                Console.WriteLine($"{i + 1}. {drinks[i].GetDrinkName()} - {drinkOrderCounts[i]} orders");
            }
        }

        //This method allows the user to see a report of the removed pizzas (softDelete = true)
        public void RemovedPizzasReport(PizzaFile pizzaFile){
            Pizza[] pizzas = pizzaFile.GetAllPizzas();

            Console.WriteLine("\n--- Removed Pizzas Report ---\n");

            bool found = false;
            for (int i = 0; i < Pizza.GetCount(); i++)
            {
                if (pizzas[i].GetSoftDelete() == true)
                {
                    Console.WriteLine(pizzas[i].ToString());
                    found = true;
                }
            }

            if (found == false)
            {
                Console.WriteLine("No pizzas have been removed.");
            }
        }

        //This method allows the user to see a report of the sold out drinks
        public void ReportSoldOutDrinks(DrinkFile drinkFile){
            Drink[] drinks = drinkFile.GetAllDrinks();

            Console.WriteLine("\n--- Sold Out Drinks Report ---\n");

            bool found = false;
            for (int i = 0; i < Drink.GetCount(); i++)
            {
                if (drinks[i].GetIsSoldOut() == true)
                {
                    Console.WriteLine(drinks[i].ToString());
                    found = true;
                }
            }

            if (found == false)
            {
                Console.WriteLine("No drinks are currently sold out.");
            }
        }

        //This method allows the user to see a report on sold out pizzas
        public void ReportSoldOutPizzas(PizzaFile pizzaFile){
            Pizza[] pizzas = pizzaFile.GetAllPizzas();

            Console.WriteLine("\n--- Sold Out Pizzas Report ---\n");

            bool found = false;
            for (int i = 0; i < Pizza.GetCount(); i++)
            {
                if (pizzas[i].GetIsSoldOut() == true)
                {
                    Console.WriteLine(pizzas[i].ToString());
                    found = true;
                }
            }

            if (found == false)
            {
                Console.WriteLine("No pizzas are currently sold out.");
            }
        }

        //This method allows the user to see a report of removed drinks
        public void ReportRemovedDrinks(DrinkFile drinkFile){
            Drink[] drinks = drinkFile.GetAllDrinks();

            Console.WriteLine("\n--- Removed Drinks Report ---\n");

            bool found = false;
            for (int i = 0; i < Drink.GetCount(); i++)
            {
                if (drinks[i].GetSoftDelete() == true)
                {
                    Console.WriteLine(drinks[i].ToString());
                    found = true;
                }
            }

            if (found == false)
            {
                Console.WriteLine("No drinks have been removed.");
            }
        }

        //This method allows the user to see all orders above a certain amount entered in
        public void ReportOrdersAbovePrice(OrderFile orderFile, PizzaFile pizzaFile, DrinkFile drinkFile){
            Order[] orders = orderFile.GetAllOrders();
            Pizza[] pizzas = pizzaFile.GetAllPizzas();
            Drink[] drinks = drinkFile.GetAllDrinks();

            Console.Write("\nEnter the price to filter orders above: $");
            double amount = double.Parse(Console.ReadLine()); 

            Console.WriteLine($"\n--- Orders Above ${amount:F2} ---\n");

            bool found = false;

                    for (int i = 0; i < Order.GetCount(); i++)
            {
                int pizzaID = orders[i].GetPizzaID();
                int drinkID = orders[i].GetDrinkID();

                double pizzaPrice = 0;
                double drinkPrice = 0;

                // Find pizza price
                for (int j = 0; j < Pizza.GetCount(); j++)
                {
                    if (pizzas[j].GetPizzaID() == pizzaID)
                    {
                        pizzaPrice = pizzas[j].GetPrice();
                        break;
                    }
                }

                // Find drink price if there is one
                if (drinkID != 0)
                {
                    for (int k = 0; k < Drink.GetCount(); k++)
                    {
                        if (drinks[k].GetDrinkID() == drinkID)
                        {
                            drinkPrice = drinks[k].GetPrice();
                            break;
                        }
                    }
                }

                double total = pizzaPrice + drinkPrice;

                if (total > amount)
                {
                    Console.WriteLine(orders[i].ToString());
                    found = true;
                }
            }

            if (found == false)
            {
                Console.WriteLine("No orders found above the entered amount.");
            }
        }

        //This method allows the user to see a report that sorts customers by email based on most spent
        public void CustomerSpendingReport(OrderFile orderFile, PizzaFile pizzaFile, DrinkFile drinkFile){
            Order[] orders = orderFile.GetAllOrders();
            Pizza[] pizzas = pizzaFile.GetAllPizzas();
            Drink[] drinks = drinkFile.GetAllDrinks();

            string[] emails = new string[100];
            double[] totals = new double[100];
            int count = 0;

            for (int i = 0; i < Order.GetCount(); i++)
            {
                string email = orders[i].GetEmail();
                int pizzaID = orders[i].GetPizzaID();
                int drinkID = orders[i].GetDrinkID();

                double pizzaPrice = 0;
                double drinkPrice = 0;

                for (int j = 0; j < Pizza.GetCount(); j++)
                {
                    if (pizzas[j].GetPizzaID() == pizzaID)
                    {
                        pizzaPrice = pizzas[j].GetPrice();
                        break;
                    }
                }

                if (drinkID != 0)
                {
                    for (int x = 0; x < Drink.GetCount(); x++)
                    {
                        if (drinks[x].GetDrinkID() == drinkID)
                        {
                            drinkPrice = drinks[x].GetPrice();
                            break;
                        }
                    }
                }

                double total = pizzaPrice + drinkPrice;

                // Check if email already exists
                int index = -1;
                for (int m = 0; m < count; m++)
                {
                    if (emails[m] == email)
                    {
                        index = m;
                        break;
                    }
                }

                if (index == -1)
                {
                    emails[count] = email;
                    totals[count] = total;
                    count++;
                }
                else
                {
                    totals[index] += total;
                }
            }

            // Sort descending by totals 
            for (int i = 0; i < count - 1; i++)
            {
                for (int j = i + 1; j < count; j++)
                {
                    if (totals[i] < totals[j])
                    {
                        // Swap totals
                        double tempTotal = totals[i];
                        totals[i] = totals[j];
                        totals[j] = tempTotal;

                        // Swap emails to stay matched
                        string tempEmail = emails[i];
                        emails[i] = emails[j];
                        emails[j] = tempEmail;
                    }
                }
            }

            Console.WriteLine("\n--- Customer Spending Report (Most to Least) ---\n");
            for (int i = 0; i < count; i++)
            {
                Console.WriteLine($"{emails[i]} spent ${totals[i]:F2}");
            }
        }

        //This method allows the user to see a report of the most ordered crust types
        public void MostOrderedCrustTypesReport(OrderFile orderFile, PizzaFile pizzaFile){
            Order[] orders = orderFile.GetAllOrders();
            Pizza[] pizzas = pizzaFile.GetAllPizzas();

            // Setup for 4 crust types
            string[] crustTypes = { "Thin", "Thick", "Stuffed", "Gluten-Free" };
            int[] crustCounts = new int[4];

            // Count crust orders
            for (int i = 0; i < Order.GetCount(); i++)
            {
                int pizzaID = orders[i].GetPizzaID();
                string crust = "";

                for (int j = 0; j < Pizza.GetCount(); j++)
                {
                    if (pizzas[j].GetPizzaID() == pizzaID)
                    {
                        crust = pizzas[j].GetCrustType();
                        break;
                    }
                }

                // Add to count
                if (crust == "Thin")
                {
                    crustCounts[0]++;
                }
                else if (crust == "Thick")
                {
                    crustCounts[1]++;
                }
                else if (crust == "Stuffed")
                {
                    crustCounts[2]++;
                }
                else if (crust == "Gluten-Free")
                {
                    crustCounts[3]++;
                }
            }

            // Sort crustTypes and crustCounts descending
            for (int i = 0; i < crustCounts.Length - 1; i++)
            {
                for (int j = i + 1; j < crustCounts.Length; j++)
                {
                    if (crustCounts[i] < crustCounts[j])
                    {
                        // Swap counts
                        int tempCount = crustCounts[i];
                        crustCounts[i] = crustCounts[j];
                        crustCounts[j] = tempCount;

                       // Swap matching crust names
                        string tempCrust = crustTypes[i];
                        crustTypes[i] = crustTypes[j];
                        crustTypes[j] = tempCrust;
                    }
                }
            }

            // Print report
            Console.WriteLine("\n--- Crust Type Popularity Report ---\n");
            for (int i = 0; i < crustTypes.Length; i++)
            {
                Console.WriteLine($"{crustTypes[i]} Crust: {crustCounts[i]} orders");
            }
        }
        
        //This methid allows the user to sort the pizzas sizes based on most ordered to least
        public void SortPizzaSizesByPopularity(OrderFile orderFile){
            Order[] orders = orderFile.GetAllOrders();

            int count8 = 0;
            int count12 = 0;
            int count16 = 0;

            // Count each pizza size
            for (int i = 0; i < Order.GetCount(); i++)
            {
                int size = orders[i].GetPizzaSize();
                if (size == 8)
                {
                    count8++;
                }
                else if (size == 12)
                {
                    count12++;
                }
                else if (size == 16)
                {
                    count16++;
                }
            }

            // Arrays for sizes and counts
            int[] sizes = { 8, 12, 16 };
            int[] counts = { count8, count12, count16 };

            //sort by counts from most to least
            for (int i = 0; i < counts.Length - 1; i++)
            {
                for (int j = i + 1; j < counts.Length; j++)
                {
                    if (counts[i] < counts[j])
                    {
                        // Swap counts
                        int tempCount = counts[i];
                        counts[i] = counts[j];
                        counts[j] = tempCount;

                        // Swap sizes
                        int tempSize = sizes[i];
                        sizes[i] = sizes[j];
                        sizes[j] = tempSize;
                    }
                }
            }

            // Display the report
            Console.WriteLine("\n--- Pizza Sizes Ordered Most to Least ---\n");
            for (int i = 0; i < sizes.Length; i++)
            {
                Console.WriteLine($"{sizes[i]} inches: {counts[i]} order(s)");
            }
        }

        //This methid allows the user to sort the drink sizes based on most ordered to least
        public void SortDrinkSizesByPopularity(OrderFile orderFile){
            Order[] orders = orderFile.GetAllOrders();

            int smallCount = 0;
            int mediumCount = 0;
            int largeCount = 0;

            // Count drink sizes
            for (int i = 0; i < Order.GetCount(); i++)
            {
                string size = orders[i].GetDrinkSize();
                if (size == "small")
                {
                    smallCount++;
                }
                else if (size == "medium")
                {
                    mediumCount++;
                }
                else if (size == "large")
                {
                    largeCount++;
                }
            }   

            // Arrays for sizes and counts
            string[] sizes = { "small", "medium", "large" };
            int[] counts = { smallCount, mediumCount, largeCount };

            // sort by counts from most to least
            for (int i = 0; i < counts.Length - 1; i++)
            {
                for (int j = i + 1; j < counts.Length; j++)
                {
                    if (counts[i] < counts[j])
                    {
                        // Swap counts
                        int tempCount = counts[i];
                        counts[i] = counts[j];
                        counts[j] = tempCount;

                        // Swap sizes
                        string tempSize = sizes[i];
                        sizes[i] = sizes[j];
                        sizes[j] = tempSize;
                    }
                }
            }

            // Display the report
            Console.WriteLine("\n--- Drink Sizes Ordered Most to Least ---\n");
            for (int i = 0; i < sizes.Length; i++)
            {
                Console.WriteLine($"{sizes[i]}: {counts[i]} order(s)");
            }
        }
    }
}