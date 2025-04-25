using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace pa5Lasttimepls
{
    public class OrderUtility
    {
        //Fields
        private Order[] orders;
        private Pizza[] pizzas;
        private Drink[] drinks;

        //Constructor
        public OrderUtility(Order[] orders){
            this.orders = orders;
        }

        //Other methods

        //This method marks an order as complete
        public void MarkOrderAsComplete(OrderFile orderFile){
            Order[] orders = orderFile.GetAllOrders();

            Console.WriteLine("Enter the orderID to mark as complete: ");
            int completedOrderID = int.Parse(Console.ReadLine());
            bool found = false;

            for(int i = 0; i < Order.GetCount(); i++){
                if(orders[i].GetOrderID() == completedOrderID && orders[i].GetOrderStatus() == false){
                    orders[i].SetOrderStatus(true);
                    found = true;
                    break;
                }
            }
            //Save changes
            if (found == true){
                orderFile.SaveAllOrders();
                Console.WriteLine("Order successfully marked as complete.");
            }
            else
            {
                Console.WriteLine("Order not found or already completed.");
            }
        }

        //This method allows customers to place an order (user must provide their email)
        public void PlaceOrder(OrderFile orderFile, PizzaFile pizzaFile, DrinkFile drinkFile){
            // Load existing orders, pizzas, and drinks
            Order[] orders = orderFile.GetAllOrders();
            Pizza[] pizzas = pizzaFile.GetAllPizzas();
            Drink[] drinks = drinkFile.GetAllDrinks();

            // Ask user for email
            Console.Write("Enter your email: ");
            string customerEmail = Console.ReadLine();

            // Validate Pizza ID
            int pizzaID = 0;
            bool validPizza = false;
            do
            {
                Console.Write("Enter the pizza ID you want to order: ");
                string pizzaInput = Console.ReadLine();
                for (int i = 0; i < Pizza.GetCount(); i++)
                {
                    if (pizzas[i].GetPizzaID().ToString() == pizzaInput && !pizzas[i].GetSoftDelete() && !pizzas[i].GetIsSoldOut())
                    {
                        pizzaID = pizzas[i].GetPizzaID();
                        validPizza = true;
                        break;
                    }
                }
                if (!validPizza)
                {
                    Console.WriteLine("Invalid input. Please enter a valid pizza ID.");
                }
            } while (!validPizza);

            // Ask about drink
            Console.Write("Would you like a drink? (yes/no): ");
            string wantsDrink = Console.ReadLine().ToLower();
            int drinkID = 0;
            string drinkSize = "none";

            if (wantsDrink == "yes")
            {
                // Validate Drink ID
                bool validDrink = false;
                do
                {
                    Console.Write("Enter the drink ID you want to order: ");
                    string drinkInput = Console.ReadLine();
                    for (int i = 0; i < Drink.GetCount(); i++)
                    {
                        if (drinks[i].GetDrinkID().ToString() == drinkInput && !drinks[i].GetSoftDelete() && !drinks[i].GetIsSoldOut())
                        {
                            drinkID = drinks[i].GetDrinkID();
                            validDrink = true;
                            break;
                        }
                    }
                    if (!validDrink)
                    {
                        Console.WriteLine("Invalid input. Please enter a valid drink ID.");
                    }
                } while (!validDrink);

                // Validate Drink Size
                bool validDrinkSize = false;
                do
                {
                    Console.Write("Enter the size of the drink (small, medium, large): ");
                    drinkSize = Console.ReadLine().ToLower();
                    if (drinkSize == "small" || drinkSize == "medium" || drinkSize == "large")
                    {
                        validDrinkSize = true;
                    }
                    else
                    {
                        Console.WriteLine("Invalid input. Please enter small, medium, or large.");
                    }
                } while (!validDrinkSize);
            }

            // Validate Pizza Size
            int pizzaSize = 0;
            bool validPizzaSize = false;
            do
            {
                Console.WriteLine("Enter the size pizza you want in inches (8, 12, 16): ");
                string sizeInput = Console.ReadLine();
                if (sizeInput == "8" || sizeInput == "12" || sizeInput == "16")
                {
                    pizzaSize = int.Parse(sizeInput);
                    validPizzaSize = true;
                }
                else
                {
                    Console.WriteLine("Invalid input. Please enter 8, 12, or 16.");
                }
            } while (!validPizzaSize);

            // Create new order
            int newOrderID = Order.GetCount() + 1;
            string orderDate = DateTime.Now.ToString("MM/dd/yy"); //Extra to get current date of the order
            bool orderStatus = false;

            orders[Order.GetCount()] = new Order(newOrderID, customerEmail, pizzaID, drinkID, drinkSize, orderDate, pizzaSize, orderStatus);
            Order.IncCount();

            // Save orders
            orderFile.SaveAllOrders();
            Console.WriteLine("Order placed successfully!");
        }
        public void ViewPastOrders(OrderFile orderFile){
            // Load all orders
            Order[] orders = orderFile.GetAllOrders();

            // Ask for email
            Console.WriteLine("Enter your email to view your past orders:");
            string emailInput = Console.ReadLine();
            bool found = false;

            // Search for email
            for (int i = 0; i < Order.GetCount(); i++)
            {
                if (orders[i].GetEmail().ToLower() == emailInput.ToLower())
                {
                    Console.WriteLine(orders[i].ToString());
                    found = true;
                }
            }

            if (found == false)
            {
                Console.WriteLine("No orders found for that email.");
            }
        }
    }

}

