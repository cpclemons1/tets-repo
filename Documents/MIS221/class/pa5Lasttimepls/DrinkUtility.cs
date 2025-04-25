using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace pa5Lasttimepls
{
    public class DrinkUtility
    {
        //Fields
        private Drink[] drinks;

        //Constructor
        public DrinkUtility(Drink[] drinks){
            this.drinks = drinks;
        }

        //Other Mehtods

        //This method allows the manager to add a new drink to the menu
        public void AddDrink(DrinkFile drinkFile){
        //Load existing drinks
        Drink[] drinks = drinkFile.GetAllDrinks();

        //Prompt for new drink info
        
        int drinkID = Drink.GetCount() + 1;

        Console.Write("Enter drink name: ");
        string drinkName = Console.ReadLine();

        Console.Write("Enter price: ");
        double price = double.Parse(Console.ReadLine());

        // By default, a new drink is not sold out and not deleted
        bool isSoldOut = false;
        bool softDelete = false;

        //Add new drink to the array
        drinks[Drink.GetCount()] = new Drink(drinkID, drinkName, price, isSoldOut, softDelete);
        Drink.IncCount();

       //Save updated list back to file
        drinkFile.SaveAllDrinks();

        Console.WriteLine("Drink added successfully!");
        }

        //This method allows the manager to remove a drink from the menu by setting softDelete to True so it won't show up as an available drink
        public void RemoveDrink(DrinkFile drinkFile){
            // Load existing drinks
            Drink[] drinks = drinkFile.GetAllDrinks();
            int count = Drink.GetCount(); 

            // Ask for ID
            Console.Write("Enter the Drink ID to remove: ");
            int removeID = int.Parse(Console.ReadLine());

            //Extra binary search
            bool found = false;
            bool alreadyRemoved = false;
            int first = 0;
            int last = count - 1;
            int middle;
            int index = -1;

            while (!found && first <= last)
            {
                middle = (first + last) / 2;
                if (drinks[middle].GetDrinkID() == removeID)
                {
                    if (drinks[middle].GetSoftDelete() == true)  // Check if it is already removed
                    {
                        alreadyRemoved = true;
                        break;  // Break out of the loop if already soft deleted
                    }

                    drinks[middle].SetSoftDelete(true);
                    found = true;
                    index = middle;
                }
                else if (drinks[middle].GetDrinkID() > removeID)
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
                Console.WriteLine("The specified drink has already been removed.");
            }
            else if (found)
            {
                // Save changes
                drinkFile.SaveAllDrinks();
                Console.WriteLine("Drink removed successfully.");
            }
            else
            {
                Console.WriteLine("Drink ID not found.");
            }
        }




        //This method allows the manager to edit any information about the drink
        public void EditDrink(DrinkFile drinkFile){
            //Load existing drinks
            Drink[] drinks = drinkFile.GetAllDrinks();

            //Ask the user for the drinkID they want to edit
            Console.Write("Enter the Drink ID to edit: ");
            int idToEdit = int.Parse(Console.ReadLine());

            bool found = false;

            //Search the array for the matching drinkID
            for (int i = 0; i < Drink.GetCount(); i++)
            {
                if (drinks[i].GetDrinkID() == idToEdit && drinks[i].GetSoftDelete() == false)
                {
                    found = true;

                    //Display menu of editable fields
                    Console.WriteLine("\nWhich field would you like to edit?");
                    Console.WriteLine("1. Name");
                    Console.WriteLine("2. Price");
                    Console.WriteLine("3. Sold Out Status");
                    Console.Write("Enter your choice (1-3): ");
                    int choice = int.Parse(Console.ReadLine());

                    //Lets the user update the selected field
                    switch (choice)
                    {
                        case 1:
                            Console.Write("Enter new name: ");
                            drinks[i].SetDrinkName(Console.ReadLine());
                            break;
                        case 2:
                            Console.Write("Enter new price: ");
                            drinks[i].SetPrice(double.Parse(Console.ReadLine()));
                            break;
                        case 3:
                            Console.Write("Is the drink sold out? (true/false): ");
                            drinks[i].SetIsSoldOut(bool.Parse(Console.ReadLine()));
                            break;
                        default:
                            Console.WriteLine("Invalid option.");
                            return;
                    }

                    //Save the updated drink to the file
                    drinkFile.SaveAllDrinks();

                    //Confirms drink was updated
                    Console.WriteLine("Drink updated successfully.");
                    break;
                }
            }
            
            //Notifies the user if the drink was not found
            if (found == false){
                Console.WriteLine("Drink not found or has been removed.");
            }
        }

        //This method lets customers view all avaiable drinks under these terms: (isSoldOut = false && softDelete == false)
        public void ViewAvailableDrinks(DrinkFile drinkFile){
            //Load existing drinks
            Drink[] drinks = drinkFile.GetAllDrinks();

            Console.WriteLine("\n--- Available Drinks ---");

            bool availableOptions = false;

            //Loop through drinks and show only available ones
            for (int i = 0; i < Drink.GetCount(); i++)
            {
                if (drinks[i].GetIsSoldOut() == false && drinks[i].GetSoftDelete() == false)
                {
                    Console.WriteLine(drinks[i].ToString());
                    availableOptions = true;
                }
            }

            // Let user know if nothing is available
            if (availableOptions == false)
            {
                Console.WriteLine("No drinks currently available.");
            }
        }
    }
}
    