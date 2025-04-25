using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace mis_221_pa_5_cpclemons
{
    public class OrderFile
    {

        //Fields
        private Order[] orders;

        //Constructor
        public OrderFile(Order[] orders){
            this.orders = orders;
        }

        //Other methods

        //This method populates the array
        public Order[] GetAllOrders(){ 
            orders = new Order[100]; 
            Order.SetCount(0);

            //Open file
            StreamReader inFile = new StreamReader("orders.txt");

            //Process file
            string line = inFile.ReadLine();
            while(line != null){
                string[] temp = line.Split('#');
                orders[Order.GetCount()] = new Order(int.Parse(temp[0]), temp[1], int.Parse(temp[2]), int.Parse(temp[3]), temp[4], temp[5], int.Parse(temp[6]), bool.Parse(temp[7]));
                Order.IncCount();
                line = inFile.ReadLine();
            }
            //Close file
            inFile.Close();
            return orders; 
        }

        //This method updates and saves the array
        public void SaveAllOrders(){
            //Open file
            StreamWriter outFile = new StreamWriter("orders.txt");

            //Process file
            for(int i = 0; i < Order.GetCount(); i++){
                outFile.WriteLine(orders[i].ToFile());
            }

            //Close file
            outFile.Close();
        }
    }
}
   
   