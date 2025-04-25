using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace mis_221_pa_5_cpclemons
{
    public class DrinkFile
    {

        //Fields
        private Drink[] drinks;

        //Constructor
        public DrinkFile(Drink[] drinks){
            this.drinks = drinks;
        }

        //Other methods

        //This method populates the array
        public Drink[] GetAllDrinks(){ 
            drinks = new Drink[100]; 
            Drink.SetCount(0);

            //Open file
            StreamReader inFile = new StreamReader("drink-menu.txt");

            //Process file
            string line = inFile.ReadLine();
            while(line != null){
                string[] temp = line.Split('#');
                drinks[Drink.GetCount()] = new Drink(int.Parse(temp[0]), temp[1], double.Parse(temp[2]), bool.Parse(temp[3]), bool.Parse(temp[4]));
                Drink.IncCount();
                line = inFile.ReadLine();
            }
            //Close file
            inFile.Close();
            return drinks; 
        }

        //This method updates and saves the array
        public void SaveAllDrinks(){
            //Open file
            StreamWriter outFile = new StreamWriter("drink-menu.txt");

            //Process file
            for(int i = 0; i < Drink.GetCount(); i++){
                outFile.WriteLine(drinks[i].ToFile());
            }

            //Close file
            outFile.Close();
        }
    }
}
    

  