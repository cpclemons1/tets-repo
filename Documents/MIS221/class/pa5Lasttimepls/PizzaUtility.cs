using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace pa5Lasttimepls
{
    public class PizzaUtility
    {
        //Fields
        private Pizza[] pizzas;

        //Constructor
        public PizzaUtility(Pizza[] pizzas){
            this.pizzas = pizzas;
        }

        //Other Methods

        //This method allows the manager to add a new pizza to the menu
        public void AddPizza(PizzaFile pizzaFile){
        //Load existing pizzas
        Pizza[] pizzas = pizzaFile.GetAllPizzas();

        //Prompt for new pizza info
    
        int pizzaID = Pizza.GetCount() + 1;

        Console.Write("Enter pizza name: ");
        string pizzaName = Console.ReadLine();

        Console.Write("Enter number of toppings: ");
        int toppingCount = int.Parse(Console.ReadLine());

        Console.Write("Enter crust type (thick, thin, stuffed, gluten-free): ");
        string crustType = Console.ReadLine();

        Console.Write("Enter price: ");
        double price = double.Parse(Console.ReadLine());

        // By default, a new pizza is not sold out and not deleted
        bool isSoldOut = false;
        bool softDelete = false;

        //Add new pizza to the array
        pizzas[Pizza.GetCount()] = new Pizza(pizzaID, pizzaName, toppingCount, crustType, price, isSoldOut, softDelete);
        Pizza.IncCount();

        // Step 4: Save updated list back to file
        pizzaFile.SaveAllPizzas();

        Console.WriteLine("Pizza added successfully!");
        }

        //This method allows the manager to remove a pizza from the menu by setting softDelete to True so it won't show up as an available pizza
        public void RemovePizza(PizzaFile pizzaFile){
            // Load existing pizzas
            Pizza[] pizzas = pizzaFile.GetAllPizzas();
            int count = Pizza.GetCount(); // Make sure this is up-to-date

            // Ask for ID
            Console.Write("Enter the Pizza ID to remove: ");
            int removeID = int.Parse(Console.ReadLine());

            bool found = false;
            bool alreadyRemoved = false;
            int first = 0;
            int last = count - 1;
            int middle;
            int index = -1;

            while (!found && first <= last)
            {
                middle = (first + last) / 2;
                if (pizzas[middle].GetPizzaID() == removeID)
                {
                    if (pizzas[middle].GetSoftDelete() == true)  // Check if it is already removed
                    {
                        alreadyRemoved = true;
                        break;  // Break out of the loop if already soft deleted
                    }

                    pizzas[middle].SetSoftDelete(true);
                    found = true;
                    index = middle;
                }
                else if (pizzas[middle].GetPizzaID() > removeID)
                {
                    last = middle - 1;
                }
                else
                {
                    first = middle + 1;
                }
            }

            // Display messages
            if (alreadyRemoved)
            {
                Console.WriteLine("The specified pizza has already been removed.");
            }
            else if (found)
            {
                // Save changes
                pizzaFile.SaveAllPizzas();
                Console.WriteLine("Pizza removed successfully.");
            }
            else
            {
                Console.WriteLine("Pizza ID not found.");
            }
        }


        //This method allows the manager to edit any information about the pizza
        public void EditPizza(PizzaFile pizzaFile){
            //Load existing pizzas
            Pizza[] pizzas = pizzaFile.GetAllPizzas();

            //Ask the user for the pizzaID they want to edit
            Console.Write("Enter the Pizza ID to edit: ");
            int idToEdit = int.Parse(Console.ReadLine());

            bool found = false;

            //Search the array for the matching pizzaID
            for (int i = 0; i < Pizza.GetCount(); i++)
            {
                if (pizzas[i].GetPizzaID() == idToEdit && pizzas[i].GetSoftDelete() == false)
                {
                    found = true;

                    //Display menu of editable fields
                    Console.WriteLine("\nWhich field would you like to edit?");
                    Console.WriteLine("1. Name");
                    Console.WriteLine("2. Topping Count");
                    Console.WriteLine("3. Crust Type");
                    Console.WriteLine("4. Price");
                    Console.WriteLine("5. Sold Out Status");
                    Console.Write("Enter your choice (1–5): ");
                    int choice = int.Parse(Console.ReadLine());

                    //Lets the user update the selected field
                    switch (choice)
                    {
                        case 1:
                            Console.Write("Enter new name: ");
                            pizzas[i].SetPizzaName(Console.ReadLine());
                            break;
                        case 2:
                            Console.Write("Enter new topping count: ");
                            pizzas[i].SetToppingCount(int.Parse(Console.ReadLine()));
                            break;
                        case 3:
                            Console.Write("Enter new crust type: ");
                            pizzas[i].SetCrustType(Console.ReadLine());
                            break;
                        case 4:
                            Console.Write("Enter new price: ");
                            pizzas[i].SetPrice(double.Parse(Console.ReadLine()));
                            break;
                        case 5:
                            Console.Write("Is the pizza sold out? (true/false): ");
                            pizzas[i].SetIsSoldOut(bool.Parse(Console.ReadLine()));
                            break;
                        default:
                            Console.WriteLine("Invalid option.");
                            return;
                    }

                    //Save the updated pizza to the file
                    pizzaFile.SaveAllPizzas();

                    //Confirms pizza was updated
                    Console.WriteLine("Pizza updated successfully.");
                    break;
                }
            }
            
            //Notifies the user if the pizza was not found
            if (found == false){
                Console.WriteLine("Pizza not found or has been removed.");
            }
        }

        //This method lets customers view all avaiable pizzas under these terms: (isSoldOut = false && softDelete == false)
        public void ViewAvailablePizzas(PizzaFile pizzaFile){
            //Load existing pizzas
            Pizza[] pizzas = pizzaFile.GetAllPizzas();

            Console.WriteLine("\n--- Available Pizzas ---");

            bool availableOptions = false;

            //Loop through pizzas and show only available ones
            for (int i = 0; i < Pizza.GetCount(); i++)
            {
                if (pizzas[i].GetIsSoldOut() == false && pizzas[i].GetSoftDelete() == false)
                {
                    Console.WriteLine(pizzas[i].ToString());
                    availableOptions = true;
                }
            }

            //Let user know if nothing is available
            if (availableOptions == false)
            {
                Console.WriteLine("No pizzas currently available.");
            }
        }
    }
}